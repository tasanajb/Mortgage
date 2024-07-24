import { NextFunction, Request, Response } from "express";
import { Log_Api, Log_Ncb, Master_Ncb } from "../dbclass";
import { createRequest, pool } from "../config";
import _ from "lodash";
import * as massage from "./message-line";
import { NVarChar } from "mssql";
import { snakeCaseKeys } from "../dbclass/SqlUtility";
import dotenv from "dotenv";
import { date } from "yup";
import { ncbStamps } from "./externals/wallet";
import { closeRequestIdPs, getVerifyRequestData } from "./externals/ncb";
import { ncbCreditOut } from "../controllers/externals/wallet";

// ncb_status_code
// NCB01	รอดำเนินการ (กรณีกดยืนยันทำรายการแต่ยังไม่เลือกธนาคาร)
// NCB02	รอดำเนินการจาก NDID (กรณีกดเลือกธนาคารแล้ว รอNDID ตรวจสอบธนาคารที่เลือก ndid status:"PENDING")
// NCB03	รอยืนยันตัวตน (กรณีเลือกธนาคารที่ยังไม่ลงทะเบียน  ndid status: "IDP_OR_AS_ERROR",  "error_code":30800)
// NCB04	รอยืนยันตัวตน NDID **ยังไม่ใช้
// NCB05	สำเร็จ (ส่งธนาคารสำเร็จ ndid status: "ACCEPTED")
// NCB06	ไม่สำเร็จ (กรณีไม่เสร็จ error ndid status: "IDP_OR_AS_ERROR" หรือ "TIMEOUT" หรือ "REJECTED" )
//stamps
// 1.	Case5: เลือกธนาคาร idpไม่ noti จนส่ง time out 2 stamps
// 2.	Case4: เลือกธนาคาร idpส่งสำเร็จ ไม่ทำรายการภายใน60นาทีtimeout 3stamps+100
// 3.	Case3: เลือกธนาคาร idpส่งสำเร็จ รายการ ไม่ส่งข้อมูล 4stamps+100+200 **จบที่นี่ก่อน
// 4.	Case2: ทำสำเร็จทุกอย่าง แต่ไม่ปิด 5stamps+100+200 // ยังไม่ทำ
// 5.	Case1: ทำสำเร็จทุกอย่าง แต่ส่งไปปิด 5stamps+100+200 // ยะงไม่ทำ
//"status": "IDP_OR_AS_ERROR" และ "response_list" "status": "accept" นับเป็น 3stamps+100
//"status": "IDP_OR_AS_ERROR" และ "response_list" มี "error_description": ".." นับเป็น 2 stamps
export const callback = async (req: Request, res: Response) => {
  try {
    await Log_Ncb.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ndid/callback",
      body: JSON.stringify(req.body),
    });

    const get_ncb_sq = await createRequest()
      .input("reference_id", NVarChar, req.body.reference_id)
      .input("ndid_request_id", NVarChar, req.body.ndid_request_id).query(`
    SELECT t1.NcbId, t1.CustomerId, t1.BankMode, t1.NcbStatusCode, t1.ProjectCode, t2.DeveloperCode
    FROM Master_Ncb t1
    LEFT JOIN Master_Project t2 ON t1.ProjectCode = t2.ProjectCode
    WHERE t1.ReferenceId = @reference_id AND t1.NdidRequestId = @ndid_request_id`);

    let get_ncb: any = snakeCaseKeys(get_ncb_sq.recordset[0]);
    let data_body: any = [];
    if (get_ncb) {
      let bank_mode: number = get_ncb.bank_mode;
      let amount: number = parseInt(process.env.WALLET_STAMPS_AMOUNT);
      let ncb_status_code: string = get_ncb.ncb_status_code;
      const customer = await createRequest().input(
        "customer_id",
        NVarChar,
        get_ncb.customer_id
      ).query(`
        SELECT t2.LineId, t1.Email, t1.CustomerId
        FROM Master_Customer t1
        INNER JOIN Mapping_Customer_Register t2 ON t1.CustomerId = t2.CustomerId AND t2.Status = 'active'
        WHERE t1.CustomerId = @customer_id`);

      let customer_data: any = snakeCaseKeys(customer.recordset[0]);
      let is_credit_out = false;
      const check_ncb = await Master_Ncb.findOne(createRequest(), {
        reference_id: req.body.reference_id,
        ndid_request_id: req.body.ndid_request_id,
      })

      if (check_ncb) { 
        is_credit_out = check_ncb?.is_credit_out;
      }

      //รอดำเนินการจาก NDID
      if (req.body.status === "PENDING") {
        ncb_status_code = "NCB02";
        //1 stamps

        data_body.push({
          order_code: req.body.ndid_request_id,
          developer_code: get_ncb.developer_code,
          type: "RP Request",
          amount: amount,
        });

        if (check_ncb && is_credit_out !== true) {
          //หักเครติด กรณี Request success
          let credit_out_data: any = {
            ncb_id: get_ncb?.ncb_id,
            developer_code: get_ncb?.developer_code,
            amount: process.env.WALLET_NCB,
            is_credit: true,
          };

          const credit_out = await ncbCreditOut(credit_out_data);
          if (credit_out.status === 200) {
            is_credit_out = true;
          }
        }
        //service กวาด close หลัง 1 นาที 30 วินาที
      }

      //ส่งธนาคารสำเร็จ
      if (req.body.status === "ACCEPTED") {
        //รวมทั้งหมด 5
        ncb_status_code = "NCB05";
        data_body.push(
          {
            order_code: req.body.ndid_request_id,
            developer_code: get_ncb.developer_code,
            type: "IDP Accept",
            amount: amount,
          },
          {
            order_code: req.body.ndid_request_id,
            developer_code: get_ncb.developer_code,
            type: "AS1 Send Data",
            amount: amount,
          }
        );

        //ส่งไป RP Receive + Verify เพื่อเก็บ 1 stamps
        const receive_verify = await getVerifyRequestData(
          req.body.reference_id
        );

        await Log_Ncb.insert(createRequest(), {
          type: "outbound",
          method: "GET",
          origin: `/ndidproxy/api/identity/verify-and-request-data/data/${req.body.reference_id}`,
          body: JSON.stringify({
            reference_id: req.body.reference_id,
            ndid_request_id: req.body.ndid_request_id,
          }),
          response: JSON.stringify(receive_verify.data),
        });

        data_body.push({
          order_code: req.body.ndid_request_id,
          developer_code: get_ncb.developer_code,
          type: "RP Receive + Verify",
          amount: amount,
        });

        //ตรวจสอบถ้าส่งไป RP Receive + Verify สำเร็จต้องส่งไป close Request เพื่อเก็บอีก เพื่อเก็บ 1 stamps
        if (
          receive_verify.status == 200 ||
          receive_verify.status == 201 ||
          receive_verify.status == 202
        ) {
          const close_request = await closeRequestIdPs(req.body.reference_id);

          await Log_Ncb.insert(createRequest(), {
            type: "outbound",
            method: "GET",
            origin: `/ndidproxy/api/identity/verify/${req.body.reference_id}/close`,
            body: JSON.stringify({
              reference_id: req.body.reference_id,
              ndid_request_id: req.body.ndid_request_id,
            }),
            response: JSON.stringify(close_request),
          });

          data_body.push({
            order_code: req.body.ndid_request_id,
            developer_code: get_ncb.developer_code,
            type: "RP Close",
            amount: amount,
          });
        }

        if (customer_data) {
          let data_noti: any = {
            line_id: customer_data.line_id,
            email: customer_data.email,
            ncb_id: get_ncb.ncb_id,
            customer_id: customer_data.customer_id,
          };
          await massage.ncbSuccess(data_noti);
        }
      }

      //เกิดข้อผิดพลาด
      if (req.body.status === "IDP_OR_AS_ERROR") {
        let data_noti: any = {
          ncb_message: "",
          ncb_id: "",
          image: "",
        };
        //เลือกธนาคารที่ยังไม่ได้ลงทะเบียน
        if (req.body.response_list[0].error_code == 30800) {
          ncb_status_code = "NCB03";
        } else {
          ncb_status_code = "NCB06";
        }

        if (req.body.response_list.length > 0) {
          let respons = await stampsData(
            req.body,
            get_ncb.developer_code,
            amount
          );
          data_body = respons;
        }

        if (customer_data) {
          switch (
            req.body.response_list[0]?.error_code ||
            req.body.data_request_list[0].response_list[0].error_code
          ) {
            case 30000:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ผู้ให้บริการยืนยันตัวตนที่ท่านเลือกไม่สามารถให้บริการได้ในขณะนี้ กรุณาทำรายการใหม่หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30000.png`,
              };
              break;
            case 30200:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ไม่สามารถทำรายการได้ในขณะนี้ กรุณาตรวจสอบเลขบัตรประชาชนของท่านและทำรายการใหม่ หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30200.png`,
              };
              break;
            case 30300:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ไม่พบข้อมูลของท่านในฐานข้อมูลผู้ใช้บริการของผู้ให้บริการยืนยันตัวตนที่ท่านเลือก กรุณาเลือกผู้ให้บริการยืนยันตัวตนรายอื่นที่ท่านเคยลงทะเบียนและมีโมบายแอปพลิเคชัน",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30300.png`,
              };
              break;
            case 30400:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ขออภัย ข้อมูลของท่านไม่เป็นปัจจุบัน กรุณาติดต่อผู้ให้บริการยืนยันตัวตนที่ท่านเลือกเพื่ออัปเดทข้อมูล หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30400.png`,
              };
              break;
            case 30500:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "การยืนยันตัวตนไม่สำเร็จเนื่องจากท่านระบุ PIN ผิด, ภาพถ่ายไม่ชัดเจน กรุณาทำรายการใหม่ หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30500.png`,
              };
              break;
            case 30510:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "การยืนยันตัวตนไม่สำเร็จเนื่องจากท่านระบุ PIN/Password ไม่ถูกต้องกรุณาทำรายการใหม่ หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30510.png`,
              };
              break;
            case 30520:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "การยืนยันตัวตนไม่สำเร็จเนื่องจากท่านยืนยันตัวตนด้วยระบบจดจำใบหน้า (Face Recognition) ไม่ผ่านตามเงื่อนไขที่กำหนด กรุณาทำรายการใหม่ หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30520.png`,
              };
              break;
            case 30530:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "การยืนยันตัวตนไม่สำเร็จเนื่องจากท่านระบุรหัส OTP ไม่ถูกต้องกรุณาทำรายการใหม่ หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30530.png`,
              };
              break;
            case 30600:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "การยืนยันตัวตนไม่สำเร็จ เนื่องจากท่านได้ยกเลิกรายการยืนยันตัวตนที่โมบายแอปพลิเคชันของผู้ให้บริการยืนยันตัวตน กรุณาเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30600.png`,
              };
              break;
            case 30610:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "การยืนยันตัวตนไม่สำเร็จ เนื่องจากท่านไม่ได้ยอมรับเงื่อนไขการให้บริการยืนยันตัวตนของผู้ให้บริการยืนยันตัวตนที่ท่านเลือก กรุณาทำรายการใหม่ หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30610.png`,
              };
              break;
            case 30700:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "การยืนยันตัวตนไม่สำเร็จ เนื่องจากผู้ให้บริการยืนยันตัวตนที่ท่านเลือกไม่สามารถให้บริการได้ในขณะนี้ กรุณาทำรายการใหม่ หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30700.png`,
              };
              break;
            case 30800:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ท่านยังไม่ได้ลงทะเบียนและยอมรับเงื่อนไขการใช้บริการ NDID ที่โมบายแอปพลิเคชันของผู้ให้บริการยืนยันตัวตน กรุณาดำเนินการก่อนทำรายการ",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30800.png`,
              };
              break;
            case 30900:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ไม่สามารถทำรายการได้ในขณะนี้ เนื่องจากอยู่นอกเวลาการให้บริการของ [IdP] กรุณาเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/30900.png`,
              };
              break;
            case 40000:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ขออภัย ท่านไม่สามารถทำรายการได้ในขณะนี้ กรุณาทำรายการใหม่ หรือติดต่อกลับที่ “เมนูแจ้งปัญหา”",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/40000.png`,
              };
              break;
            case 40200:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ขออภัย ไม่สามารถดำเนินการต่อได้เนื่องจากท่านใส่เลขบัตรประชาชนไม่ถูกต้อง กรุณาทำรายการใหม่อีกครั้ง",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/40200.png`,
              };
              break;
            case 40300:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ขออภัย ไม่สามารถดำเนินการต่อได้ กรุณาติดต่อกลับที่ “เมนูแจ้งปัญหา”",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/40300.png`,
              };
              break;
            case 40400:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ขออภัย ไม่สามารถดำเนินการต่อได้เนื่องจากข้อมูลไม่ถูกต้อง กรุณาทำรายการใหม่อีกครั้ง หรือติดต่อกลับที่ “เมนูแจ้งปัญหา”",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/40400.png`,
              };
              break;
            case 40500:
              data_noti = {
                line_id: customer_data.line_id,
                customer_id: customer_data.customer_id,
                ncb_message:
                  "ขออภัย ไม่สามารถดำเนินการต่อได้ กรุณาติดต่อกลับที่ “เมนูแจ้งปัญหา”",
                ncb_id: get_ncb.ncb_id,
                image: `${process.env.URL}/images/notification/40500.png`,
              };
              break;
          }
        }
        await massage.ncbError(data_noti);
      }

      //หมดเวลา
      if (req.body.status === "TIMEOUT") {
        ncb_status_code = "NCB06";

        if (req.body.response_list.length > 0) {
          let respons = await stampsData(
            req.body,
            get_ncb.developer_code,
            amount
          );
          data_body = respons;
        }

        data_body.push({
          order_code: req.body.ndid_request_id,
          developer_code: get_ncb.developer_code,
          type: "Time Out",
          amount: amount,
        });

        let data_noti = {
          line_id: customer_data.line_id,
          customer_id: customer_data.customer_id,
          ncb_message:
            "กรุณาไปยืนยันตัวตนที่โมบายแอปพลิเคชั่นของผู้ให้บริการที่ท่านเลือก ภายใน 60 นาทีและกลับมาทำรายการต่อที่นี่",
          ncb_id: get_ncb.ncb_id,
          image: `${process.env.URL}/images/notification/timeout.png`,
        };

        await massage.ncbTimeOutAndReject(data_noti);
      }

      //ถูกปฏิเสธ
      if (req.body.status === "REJECTED") {
        ncb_status_code = "NCB06";

        if (req.body.response_list.length > 0) {
          let respons = await stampsData(
            req.body,
            get_ncb.developer_code,
            amount
          );
          data_body = respons;
        }
        if (customer_data) {
          let data_noti = {
            line_id: customer_data.line_id,
            customer_id: customer_data.customer_id,
            ncb_message:
              "ท่านได้ปฏิเสธการยืนยันตัวตนของผู้ให้บริการยืนยันตัวตนที่ท่านเลือก กรุณาทำรายการใหม่หรือเลือกผู้ให้บริการยืนยันตัวตนรายอื่น",
            ncb_id: get_ncb.ncb_id,
            image: `${process.env.URL}/images/notification/reject.png`,
          };

          await massage.ncbTimeOutAndReject(data_noti);
        }
      }

      //คำขอไม่สำเร็จ
      if (req.body.status === "REQUESTED_ERROR") {
        ncb_status_code = "NCB06";
        //ncb_status_code = "NCB01";
        // if (customer_data) {
        //   let data_noti: any = {
        //     line_id: customer_data.line_id,
        //     email: customer_data.email,
        //     ncb_id: get_ncb.ncb_id,
        //     customer_id: customer_data.customer_id,
        //   };
        //   await massage.ncbRequestedError(data_noti);
        // }
      }

      let ndid_response: any = _.omit(req.body, [
        "reference_id",
        "ndid_request_id",
      ]);

      await Master_Ncb.update(
        createRequest(),
        {
          ndid_response: JSON.stringify(ndid_response),
          ncb_status_code: ncb_status_code,
          is_credit_out: is_credit_out,
          update_date: new Date(),
        },
        {
          reference_id: req.body.reference_id,
          ndid_request_id: req.body.ndid_request_id,
        }
      );
    }

    if (data_body.length > 0) {
      const ncb_stamps = await ncbStamps(data_body);

      if (ncb_stamps.status != 200) {
        await Log_Api.insert(createRequest(), {
          type: "outbound",
          method: "POST",
          origin: "/externals/stamps",
          body: JSON.stringify(data_body),
          error_message: ncb_stamps?.message || "ncb stamps ไม่สำเร็จ",
        });
      }
    }

    res.status(200).send({
      status: 200,
      message: "success",
    });
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: "error",
    });
  }
};

async function stampsData(
  ndid_data: any,
  developer_code: string,
  amount: number
) {
  let data_stamps: any = [];
  if (ndid_data.response_list.length > 0) {
    let data_ipd = {
      order_code: ndid_data.ndid_request_id,
      developer_code: developer_code,
      type: "IdP Accept",
      amount: amount,
    };

    if (ndid_data.response_list[0].status === "reject") {
      data_ipd.type = "IdP Reject";
    }

    if (ndid_data.response_list[0].error_code) {
      data_ipd.type = "IdP Error";
    }

    data_stamps.push(data_ipd);

    if (ndid_data.data_request_list[0].response_list.length > 0) {
      let data_as = {
        order_code: ndid_data.ndid_request_id,
        developer_code: developer_code,
        type: "AS1 Send Data",
        amount: amount,
      };

      if (ndid_data.data_request_list[0].response_list[0].error_code) {
        data_as.type = "AS1 Respond Error";
      }

      data_stamps.push(data_as);
    }
  }
  return data_stamps;
}

export const notitest = async (req: Request, res: Response) => {
  try {
    let data_noti: any = {
      line_id: req.body.line_id,
      email: "",
      ncb_id: req.body.ncb_id,
      customer_id: req.body.customer_id,
    };
    
    await massage.ncbSuccess(data_noti);

    res.status(200).send({
      status: 200,
      message: "success",
    });
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: "error",
    });
  }
};
