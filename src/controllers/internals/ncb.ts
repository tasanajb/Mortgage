import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import sql from "mssql";
import axios from "axios";
import {
  Master_Ncb,
  Master_Ncb_Order,
  Master_Ncb_Status,
  Log_Api,
  Master_Customer,
  Master_Customer_Address,
  Mapping_Customer_Register,
  Master_Bank,
  Master_Prefix,
  Master_Idp,
} from "../../dbclass";
import moment from "moment";
import { snakeCaseKeys } from "../../utility";
import _, { concat, replace, split } from "lodash";
import { v4 as uuidv4 } from "uuid";
import * as validation from "../validation";
import { quotationFromRem } from "../externals/quotation";
import * as ndid from "../externals/ncb";
import { ncbCreditOut, checkCredit } from "../externals/wallet";
import { writeFileSync, readFile, readFileSync } from "fs";
import path from "path";

//****เดี๋ยวมีปรับเรื่องเวลาถ้าทำรายการเกินกำหนดเวลา */
export const ncbListAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ncb_list = await createRequest().input(
      "customer_id",
      sql.NVarChar,
      req.customer_id
    ).query(`
      SELECT   t1.NcbId, FORMAT (t1.CreateDate, 'dd/MM/yyyy') as NcbCreateDate, FORMAT (t1.NcbDateOfExpiry, 'dd/MM/yyyy') as NcbDateOfExpiry, 
        t4.Name as NcbStatus, CONCAT(t2.FirstName , ' ', t2.LastName) as CustomerName, t2.CitizenId
      FROM Master_Ncb t1
      INNER JOIN Master_Customer t2 ON t1.CustomerId = t2.CustomerId
      LEFT JOIN Master_Ncb_Status t4  ON t1.NcbStatusCode = t4.NcbStatusCode
      WHERE t2.CustomerId = @customer_id
        AND t1.CreateDate BETWEEN DATEADD(DAY, DATEDIFF(DAY, 0, DATEADD(DAY,-30, GetDate())), 0) AND GETDATE()
    `);

    res.status(200).send({
      status: 200,
      message: "success",
      data: snakeCaseKeys(ncb_list.recordset),
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const ncbDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ncb_id } = req.body;
    const ncb_detail: any = await createRequest()
      .input("ncb_id", sql.NVarChar, ncb_id)
      .input("customer_id", sql.NVarChar, req.customer_id).query(`
        SELECT ISNULL(t1.ProjectName,'') as ProjectName, t1.NcbId,FORMAT (t1.CreateDate, 'dd/MM/yyyy') as NcbCreateDate, FORMAT (t1.NcbDateOfExpiry, 'dd/MM/yyyy') as NcbDateOfExpiry,
        t4.Name as NcbStatus, CONCAT('คุณ', t2.FirstName , ' ', t2.LastName) as CustomerName,t2.CitizenId, t2.MobileNumber, t2.Email, t1.RequestParams
        FROM Master_Ncb t1
        INNER JOIN Master_Customer t2 ON t1.CustomerId = t2.CustomerId
        LEFT JOIN Master_Prefix t3 ON t2.PrefixId = t3.id
        LEFT JOIN Master_Ncb_Status t4  ON t1.NcbStatusCode = t4.NcbStatusCode
        WHERE t2.CustomerId = @customer_id AND t1.NcbId = @ncb_id
      `);

    let ncb_data = snakeCaseKeys(ncb_detail.recordset[0]);

    if (!ncb_data) {
      return res
        .status(400)
        .send({ status: 400, message: "ไม่พบข้อมูลการขอเครดิตบูโร" });
    }

    const address = await Master_Customer_Address.findOne(createRequest(), {
      customer_id: req.customer_id,
      address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
    });

    let address_send_doc = _.omit(
      address,
      "customer_id",
      "id",
      "create_date",
      "update_date"
    );

    let request_params: any = JSON.parse(ncb_data.request_params);

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        ncb_id: ncb_data.ncb_id,
        project_name: "โครงการ " + ncb_data.project_name,
        customer_name: request_params?.customer_name || ncb_data.customer_name,
        citizen_id: request_params?.citizen_id || ncb_data.citizen_id,
        mobile_number: request_params?.mobile_number || ncb_data.mobile_number,
        email: request_params?.email || ncb_data.email,
        address_send_doc: request_params?.address_send_doc || address_send_doc,
        ncb_create_date: ncb_data.ncb_create_date,
      },
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const ncbCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customer = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });

    let first_name = customer?.first_name ? `${customer?.first_name} ` : "";
    let last_name = customer?.last_name ? `${customer?.last_name} ` : "";
    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        customer_id: customer.customer_id,
        customer_name: first_name + last_name,
        citizen_id: customer.citizen_id,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ncb/customer/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const ncbConfirmDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customer_data = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });

    if (!customer_data) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูล",
      });
    }

    const prefix = await Master_Prefix.findOne(createRequest(), {
      id: customer_data.prefix_id,
    });

    const address = await Master_Customer_Address.findOne(createRequest(), {
      customer_id: req.customer_id,
      address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
    });

    let address_send_doc = _.omit(address, [
      "customer_id",
      "id",
      "create_date",
      "update_date",
    ]);
    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        customer_id: customer_data.customer_id,
        member_id: customer_data?.member_id || "",
        customer_name:
          "คุณ" + customer_data.first_name + " " + customer_data.last_name,
        citizen_id: customer_data.citizen_id,
        email: customer_data.email,
        mobile_number: customer_data.mobile_number,
        address_send_doc: address_send_doc,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ncb/confirm/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const ncbReConfirmDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ncb_data = await Master_Ncb.findOne(createRequest(), {
      ncb_id: req.body.ncb_id,
      customer_id: req.customer_id,
      ncb_status_code: "NCB03",
    });

    if (!ncb_data) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอเครดิตบูโร ที่รอยืนยันตัวตน",
      });
    }

    const customer_data = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });

    if (!customer_data) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูล",
      });
    }

    const prefix = await Master_Prefix.findOne(createRequest(), {
      id: customer_data.prefix_id,
    });

    const address = await Master_Customer_Address.findOne(createRequest(), {
      customer_id: req.customer_id,
      address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
    });

    let address_send_doc = _.omit(address, [
      "customer_id",
      "id",
      "create_date",
      "update_date",
    ]);
    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        ncb_type: ncb_data.ncb_type,
        is_ncb: ncb_data.is_ncb,
        is_ncb_terms: ncb_data.is_ncb_terms,
        project_code: ncb_data.project_code,
        project_name: "โครงการ " + ncb_data.project_name,
        booking_no: ncb_data.booking_no,
        contract_id: ncb_data.contract_id,
        ncb_create_date: moment(ncb_data.create_date).format("DD/MM/yyyy"),
        customer_data: {
          customer_id: customer_data.customer_id,
          member_id: customer_data?.member_id || "",
          customer_name:
            "คุณ" + customer_data.first_name + " " + customer_data.last_name,
          citizen_id: customer_data.citizen_id,
          email: customer_data.email,
          mobile_number: customer_data.mobile_number,
          address_send_doc: address_send_doc,
        },
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ncb/re-confirm/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const ncbCreate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let trans = new sql.Transaction(pool);
  try {
    await trans.begin();
    if (!req.body.ncb_create_date) {
      req.body.ncb_create_date = "";
    }

    if (!req.body.contract_no) {
      req.body.contract_no = "";
    }

    //compare request data and validation
    if (
      !validation.compareKeys(
        [
          "ncb_type",
          "is_ncb",
          "is_ncb_terms",
          "booking_no",
          "contract_id",
          "contract_no",
          "project_code",
          "project_name",
          "unit_id",
          "ncb_create_date",
          "customer_data",
        ],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.ncbSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const {
      ncb_type = "developer",
      is_ncb,
      is_ncb_terms,
      booking_no,
      contract_id,
      contract_no,
      project_code,
      project_name,
      unit_id,
      customer_data,
    } = req.body;

    let customer_id = req.customer_id;
    //check เลขบัตรประชาชนในระบบ
    const check_customer = await Master_Customer.findOne(createRequest(), {
      customer_id: customer_id,
      citizen_id: customer_data?.citizen_id,
    });
    if (!check_customer) {
      return res.status(400).send({
        status: 400,
        message: "ขออภัย ไม่พบข้อมูลของท่านในระบบ",
      });
    }
    //ncb_type: ขอด้วยตนเอง customer, ผ่านโครการ developer
    // NCB01	รอดำเนินการ, NCB02 รอดำเนินการจาก NDID, NCB03	รอยืนยันตัวตน, NCB05	สำเร็จ, NCB06	ไม่สำเร็จ
    //1. check ใบจอง และncb เดิม
    const check_booking = await Master_Ncb.findOne(createRequest(), {
      booking_no: booking_no,
      contract_id: contract_id,
      customer_id: customer_id,
    });

    if (check_booking) {
      if (check_booking.ncb_status_code != "NCB03") {
        return res.status(400).send({
          status: 400,
          message:
            "ท่านได้ดำเนินการขอเครดิตบูโรไปแล้ว หรืออยู่ระหว่างขั้นตอนดำเนินการโปรดตรวจสอบสถานะเครดิตบูโร",
        });
      }
    }

    const ncb = await createRequest().input(
      "customer_id",
      sql.NVarChar,
      customer_id
    ).query(`
    SELECT *
    FROM Master_Ncb
    WHERE NcbStatusCode IN('NCB01','NCB02','NCB03','NCB04')
    --AND NcbCount < 2
    AND getDate() <= NcbDateOfExpiry AND NcbDateOfExpiry IS NOT NULL
    AND CustomerId = @customer_id
   `);

    let ncb_id: string = "";
    let ndid_reference: number = 0;
    //2. Create NCB (กรณีไม่มี ncb)
    if (ncb.recordset.length === 0) {
      //2.1 create ncb ***status: NCB02 "รอดำเนินการ"
      const ncb_runnumber = await createRequest()
        .input("RunKey", sql.NVarChar, "NCB")
        .input("KeyCode", sql.NVarChar, "NCB")
        .input("CreateDate", sql.Date, new Date())
        .execute("sp_CreateRunning");

      ncb_id = String(ncb_runnumber.recordset[0]["RunKey"]);

      //2.1 create ncb ***status: NCB02 "รอดำเนินการ"
      const ndid_reference_runnumber = await createRequest()
        .input("RunKey", sql.NVarChar, "NDID")
        .input("KeyCode", sql.NVarChar, "NDID")
        .input("CreateDate", sql.Date, new Date())
        .execute("sp_CreateRunningNdid");

      ndid_reference = Number(ndid_reference_runnumber.recordset[0]["RunKey"]);
      console.log("ndid_reference", ndid_reference);

      await Master_Ncb.insert(createRequest(trans), {
        ncb_id: ncb_id,
        is_ncb: is_ncb,
        is_ncb_terms: is_ncb_terms,
        ncb_type: ncb_type,
        customer_id: customer_id,
        booking_no: booking_no,
        contract_id: contract_id,
        contract_no: contract_no,
        project_code: project_code,
        unit_id: unit_id,
        project_name: project_name.replace("โครงการ", "").toString(),
        ncb_status_code: "NCB01",
        ndid_reference: ndid_reference,
        request_params: JSON.stringify(customer_data),
      });
    }

    let ncb_data = snakeCaseKeys(ncb.recordset[0]) as Master_Ncb;
    if (ncb_data) {
      ncb_id = ncb_data.ncb_id;
      if (
        ncb_data.ncb_status_code != "NCB03" &&
        ncb_data.contract_id != contract_id
      ) {
        //3. กรณีมี ncb ที่กำลังใช้งาน ยกเว้น NCB03 รอยืนยันตัวตนให้ผ่านไปเลือกธนาคารได้อีก
        return res.status(400).send({
          status: 400,
          message:
            "ท่านได้ดำเนินการขอเครดิตบูโรไปแล้ว หรืออยู่ระหว่างขั้นตอนดำเนินการโปรดตรวจสอบสถานะเครดิตบูโร",
        });
      }

      await Master_Ncb.update(
        createRequest(trans),
        {
          ncb_status_code: "NCB01",
          update_date: new Date(),
        },
        {
          ncb_id: ncb_id,
          booking_no: booking_no,
          contract_id: contract_id,
          customer_id: customer_id,
        }
      );
    }

    // 4. หักเครติด จ่ายเงิน
    // 5. ดึง รายการธนาคารจาก NDID และ map ธนาคารผู้ให้บริการที่เคยลงทะเบียน
    const ncb_idps = await ndid.listIdPs(customer_data.citizen_id);
    if (ncb_idps.status != 200) {
      throw ncb_idps;
    }

    //6. map bank
    let map_bank = await mapIdp(
      ncb_idps.data.id_providers,
      ncb_idps.data.id_on_the_fly
    );

    await trans.commit();
    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        ncb_id: ncb_id,
        bank_ndid: map_bank?.bank_ndid || [],
        bank_other: map_bank?.bank_other || [],
      },
    });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ncb/create",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || error.status || 500).send({
      status: error?.status || error.status || 500,
      message: error?.message,
    });
  }
};

export const ncbScanQrCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (!validation.compareKeys(["line_id", "data"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.scanQrSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });
    const { line_id, data } = req.body;

    const data_booking = data.split("|");
    let contract_id = data_booking[2];

    //1. ตรวจสอบใบจอง
    const check_ncb = await Master_Ncb.findOne(createRequest(), {
      contract_id: contract_id,
      customer_id: req.customer_id,
    });

    if (check_ncb) {
      return res.status(400).send({
        status: 400,
        message:
          "ลูกค้าได้ทำการสแกนใบจองนี้ไปแล้ว กรุณาตรวจสอบรายการเครติดบูโร",
      });
    }

    ///2. check customer โดยดึงข้อมูล customer จาก line_id
    const customer = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });

    if (!customer) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่าน กรุณาลงทะเบียนเข้าใช้งาน",
      });
    }

    //2. ดึงข้อมูล ใบจองจาก REM From API External
    let data_body: any = {
      customer_id: customer.customer_id,
      data: data,
    };
    const quotation = await quotationFromRem(data_body);

    if (quotation.status != 200) {
      throw quotation;
    }

    const quotation_data = snakeCaseKeys(quotation.data);
    const loan_data = snakeCaseKeys(quotation_data.rem_booking);

    const customer_data = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        project_code: loan_data?.project_code || "",
        project_name: "โครงการ " + loan_data?.project_name || "",
        unit_id: loan_data?.collateral_info[0]?.unit_id || "",
        booking_no: loan_data?.booking_no || "",
        contract_id: loan_data?.contract_id || "",
        contract_no: loan_data?.contract_no || "",
        customer_id: customer_data?.customer_id || "",
        first_name: customer_data?.first_name || "",
        last_name: customer_data?.last_name || "",
        citizen_id: customer_data?.citizen_id || "",
        member_id: customer_data?.member_id || "",
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ncb/scan-qr",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error?.response?.data?.message || error.message,
    });
  }
};

export const ncbBankIdpList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //1. หาหมายเลขบัตรประชาชน
    const get_customer = await createRequest()
      .input("customer_id", sql.NVarChar, req.customer_id)
      .input("ncb_id", sql.NVarChar, req.body.ncb_id)
      .query(
        `SELECT TOP 1 t2.CitizenId, t1.NcbStatusCode
      FROM Master_Ncb t1
      INNER JOIN Master_Customer t2 ON t1.CustomerId = t2.CustomerId
      WHERE t1.CustomerId = @customer_id AND t1.NcbId = @ncb_id`
      );

    let customer_data: any = snakeCaseKeys(get_customer.recordset[0]);
    if (!customer_data) {
      res.status(400).send({
        status: 400,
        message: "ขออภัย ไม่พบข้อมูลผู้ใช้งานที่ขอ NCB นี้",
      });
    }

    //ตรวจสอบาถานะ NCB หากอยู่ระหว่างขั้นตอนการตรวจสอบ หรือ ทำรายการสำเร็จ หรือ ไม่สำเร็จ จะไม่ให้เลือก bank ได้ อีก
    if (
      customer_data.ncb_status_code === "NCB02" ||
      customer_data.ncb_status_code === "NCB05" ||
      customer_data.ncb_status_code === "NCB06"
    ) {
      return res.status(400).send({
        status: 400,
        message: "ขออภัยท่านได้ทำรายการไปแล้ว กรุณาตรวจสอบสถานะการทำรายการ",
      });
    }

    //2.ดึงข้อมูลเจ้าของข้อมูล (ธนาคารที่ลงทะเบียนแล้ว)
    const ncb_idps = await ndid.listIdPs(customer_data.citizen_id);
    if (ncb_idps.status != 200) {
      throw ncb_idps;
    }

    //3. map bank
    let map_bank = await mapIdp(
      ncb_idps.data.id_providers,
      ncb_idps.data.id_on_the_fly
    );

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        ncb_id: req.body.ncb_id,
        bank_ndid: map_bank?.bank_ndid || [],
        bank_other: map_bank?.bank_other || [],
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ncb/bank-idp/list",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

export const ncbBankIdpConfirm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (
      !validation.compareKeys(["ncb_id", "bank_code", "bank_mode", "pin"], req.body)
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.bankIdpSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { ncb_id, bank_code, bank_mode } = req.body;
    //ตรวจสอบเวลาอยู่ในช่วงที่ธนาคารเปิดให้หรือไม่ ช่วงเวลา 07:00 - 21:00 น.
    const start_time = process.env.IDP_START_TIME;
    const end_time =  process.env.IDP_END_TIME;
    let now_time = new Date().toTimeString();
    if (now_time <= start_time || now_time >= end_time) {
      throw {
        status: 400,
        message: `ขออภัย ไม่สามารถทำรายได้้เนื่องจากอยู่นอกช่วงเวลาทำการ กรุณาทำรายการอีกครั้งในเวลา ${start_time.substring(0,5)}-${end_time.substring(0,5)} น.`,
      };
    }

    //1. หาหมายเลขบัตรประชาชน
    const get_customer = await createRequest()
      .input("customer_id", sql.NVarChar, req.customer_id)
      .input("ncb_id", sql.NVarChar, ncb_id)
      .query(
        `SELECT TOP 1 t2.CitizenId, t2.FirstName, t2.LastName, t2.MobileNumber, t2.Email, t1.NcbStatusCode, 
        CONCAT( ISNULL(t3.Address+' ',''),  ISNULL('หมู่'+ NULLIF(t3.Moo,'')+' ',''), ISNULL(t3.Village+' ',''), ISNULL('ชั้น'+ NULLIF(t3.Floor,'')+' ',''), ISNULL('ซอย'+NULLIF(t3.Soi, '')+' ',''), 
        ISNULL('ถนน'+NULLIF(t3.Road,'')+',',''), ISNULL(' '+t3.SubDistrictName+',',''),  ISNULL(' '+t3.DistrictName+',',''),  ISNULL(' '+t3.ProvinceName+',',''), ISNULL(' '+t3.PostCode,'')) as address, t4.DeveloperCode
        , t1.NdidReference, t1.RequestParams,
        CONCAT( ISNULL(JSON_VALUE(t1.RequestParams, '$.address_send_doc.address')+' ',''),  ISNULL('หมู่'+ NULLIF(JSON_VALUE(t1.RequestParams, '$.address_send_doc.moo'),'')+' ','')
        , ISNULL(JSON_VALUE(t1.RequestParams, '$.address_send_doc.village')+' ',''), ISNULL('ชั้น'+ NULLIF(JSON_VALUE(t1.RequestParams, '$.address_send_doc.floor'),'')+' ',''), 
        ISNULL('ซอย'+NULLIF(JSON_VALUE(t1.RequestParams, '$.address_send_doc.soi'), '')+' ',''), ISNULL('ถนน'+NULLIF(JSON_VALUE(t1.RequestParams, '$.address_send_doc.road'),'')+',',''), 
        ISNULL(' '+JSON_VALUE(t1.RequestParams, '$.address_send_doc.sub_district_name')+',',''),  ISNULL(' '+JSON_VALUE(t1.RequestParams, '$.address_send_doc.district_name')+',',''), 
         ISNULL(' '+JSON_VALUE(t1.RequestParams, '$.address_send_doc.province_name')+',',''), ISNULL(' '+JSON_VALUE(t1.RequestParams, '$.address_send_doc.post_code'),'')) as AddressSendDoc
        FROM Master_Ncb t1
          INNER JOIN Master_Customer t2 ON t1.CustomerId = t2.CustomerId
          LEFT JOIN Master_Customer_Address t3 ON t2.CustomerId = t3.CustomerId
          LEFT JOIN Master_Project t4 ON t1.ProjectCode = t4.ProjectCode
        WHERE t1.CustomerId = @customer_id AND t1.NcbId = @ncb_id`
      );

    let customer_data: any = snakeCaseKeys(get_customer.recordset[0]);
    if (!customer_data) {
      return res.status(400).send({
        status: 400,
        message: "ขออภัย ไม่พบข้อมูลผู้ใช้งานที่ขอ NCB นี้",
      });
    }

    //2.ตรวจสอบาถานะ NCB หากอยู่ระหว่างขั้นตอนตรวจสอบ หรือ ทำรายการสำเร็จ หรือ ไม่สำเร็จ จะไม่ให้เลือก bank ได้ อีก
    if (
      customer_data.ncb_status_code === "NCB02" ||
      customer_data.ncb_status_code === "NCB05" ||
      customer_data.ncb_status_code === "NCB06"
    ) {
      return res.status(400).send({
        status: 400,
        message: "ขออภัยท่านได้ทำรายการไปแล้ว กรุณาตรวจสอบสถานะการทำรายการ",
      });
    }

    //3. หักเครติด กรณี เลือกธนาคารที่ลงทะเบียนแล้ว (bank_mode = 2)
    let credit_out_data: any = {
      ncb_id: ncb_id,
      developer_code: customer_data.developer_code,
      amount: process.env.WALLET_NCB,
      is_credit: true,
    };
    // if (bank_mode == 1) {
    //   credit_out_data.is_credit = false;
    // }

    //const credit_out = await ncbCreditOut(credit_out_data);
    //check credit
    const credit_check = await checkCredit(credit_out_data);
    if (credit_check.status != 200) {
      throw credit_check;
    }

    let request_params_data: any = JSON.parse(customer_data.request_params);
    //api : /ndidproxy/api/identity/verify
    // let data_body: any = {
    //   citizen_id: customer_data.citizen_id,
    //   bank_code: bank_code,
    //   bank_mode: bank_mode,
    // }
    // const verify_idps = await data_body(data_body);

    let verify_idps_data: any = {
      citizen_id: customer_data.citizen_id,
      service_id: process.env.NDID_SERVICE_ID,
      as_id_list: [process.env.NDID_AS_ID_LIST],
      bank_code: bank_code,
      bank_mode: bank_mode,
      ndid_reference: customer_data.ndid_reference,
      request_params: {
        uuid: uuidv4(),
        agent_shortname: "ICON",
        id_type: "01",
        id_number: customer_data.citizen_id,
        firstname: customer_data.first_name,
        lastname: customer_data.last_name,
        mobile_no:
          request_params_data?.mobile_number || customer_data.mobile_number,
        email: request_params_data?.email || customer_data.email,
        address:
          customer_data?.address_send_doc || customer_data?.address || "",
        pro: "01",
        report: "NSC", //NSC = Credit Report with Credit Score  หรือ N = Credit Report without Credit Score
        reference: "ICON" + moment().format("YYYYMMDDHHmmss"), //ไม่เกิน 25 ตัวอักษร ICOM + timestamp
        version: 1,
      },
    };

    let promotion_usable: any;
    let path_promotion_data: string = path.join(
      __dirname,
      "../..",
      "",
      "ndid-promotion.json"
    );

    //ดึงจำนวนการใช้ promotion ndid
    const promotion_data: any = readFileSync(path_promotion_data);
    console.log(Buffer.byteLength(promotion_data));
    if (Buffer.byteLength(promotion_data) > 0) {
      let parsed_data: any = JSON.parse(promotion_data);
      console.log(
        "promotion คงเหลือก่อนใช้",
        parsed_data?.promotion_count || 0,
        "ครั้ง"
      );
      if (parsed_data["promotion_count"]) {
        if (parsed_data?.promotion_count > 0) {
          verify_idps_data.request_params.promotion_code =
            process.env.NDID_PROMOTION_CODE;
          parsed_data.promotion_count -= 1;
        }

        promotion_usable = parsed_data;
      }
    }

    //4.ส่งข้อมูลการเลือกธนาคารไป NDID
    const verify_idps = await ndid.verifyRequestData(verify_idps_data);

    if (verify_idps.status != 200 && verify_idps.status != 202) {
      throw verify_idps;
    }

    if (promotion_usable) {
      let data = JSON.stringify(promotion_usable);
      await writeFileSync(path_promotion_data, data);
      console.log(
        "promotion คงเหลือหลังใช้",
        promotion_usable?.promotion_count,
        "ครั้ง"
      );
    }

    await Master_Ncb.update(
      createRequest(),
      {
        bank_code: bank_code,
        bank_mode: bank_mode,
        reference_id: verify_idps.data.reference_id,
        ndid_request_id: verify_idps.data.ndid_request_id,
        icon_reference_ndid: verify_idps_data?.request_params?.reference || "",
        ncb_status_code: "NCB02",
        update_date: new Date(),
      },
      {
        ncb_id: ncb_id,
        customer_id: req.customer_id,
      }
    );

    res.status(verify_idps?.status || 200).send({
      status: verify_idps?.status || 200,
      message: "success",
      data: {
        ...verify_idps.data,
        ndid_reference: customer_data.ndid_reference,
        bank_code: bank_code,
        promotion_usable: `promotion คงเหลือ ${
          promotion_usable?.promotion_count || 0
        } ครั้ง`,
      },
    });

    // res.status(200).send({
    //   status: 200,
    //   message: "success",
    //   verify_idps_data: verify_idps_data,
    // });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/ncb/bank-idp/confirm",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

//map bank
//bank_mode 1 เลือกธนาคารที่ยังไม่ได้ลงทะเบียน (ธนาคารอื่นๆ)
//bank_mode 2: เลือกธนาคารที่ลงทะเบียน (ผู้ให้บริการที่เคยลงทะเบียน)
async function mapBank(bank_for_ndid: any) {
  const master_bank = await Master_Bank.find(createRequest(), {
    status: "active",
  });

  let bank_ndid: any = [];
  let bank_other: any = [];
  //1. หา master bank ทั้งหมด
  let data = await _.map(master_bank, (n: any) => {
    let { bank_code, name, bank_logo } = n;
    return {
      bank_code: bank_code,
      bank_name: name,
      bank_logo:
        bank_logo != "" && bank_logo != null
          ? process.env.URL + bank_logo
          : process.env.URL + "/images/noimage.jpg",
      bank_mode: 1,
    };
  });

  //2. map bank ที่ได้จาก ndid
  for (var i in bank_for_ndid) {
    _.find(data, (n: any) => {
      let { bank_code, bank_name, bank_logo } = n;
      if (n.bank_code === bank_for_ndid[i]) {
        bank_ndid.push({
          bank_code: bank_code,
          bank_name: bank_name,
          bank_logo: bank_logo,
          bank_mode: 2,
        });
      }
    });
  }

  //3. list bank อื่นๆ นอกเหลือจาก ndid
  bank_other = _.pullAllBy(data, bank_ndid, "bank_code");

  return {
    bank_ndid: bank_ndid,
    bank_other: bank_other,
  };
}

async function mapIdp(idp_data: any, on_the_fly_data: any) {
  const master_idp = await Master_Idp.find(createRequest(), {
    status: "active",
  });

  //1. เอา idp ที่ซ้ำกันออก
  let bank_on_the_fly: any = _.pullAllBy(on_the_fly_data, idp_data, "id");

  let bank_ndid: any = [];
  let bank_other: any = [];
  //2.map ธนาคารที่เคยลงทะเบียน
  for (var i in idp_data) {
    _.find(master_idp, (n: any) => {
      let { idp_logo } = n;
      if (n.idp_id === idp_data[i].id) {
        bank_ndid.push({
          bank_code: idp_data[i].id,
          bank_name: idp_data[i].display_name_th,
          bank_logo:
            idp_logo != "" && idp_logo != null
              ? process.env.URL + idp_logo
              : process.env.URL + "/images/noimage.jpg",
          bank_mode: 2,
        });
      }
    });
  }

  //3. map ธนาคาร on thr fly
  for (var i in bank_on_the_fly) {
    _.find(master_idp, (n: any) => {
      let { idp_logo } = n;
      if (n.idp_id === bank_on_the_fly[i].id) {
        bank_other.push({
          bank_code: bank_on_the_fly[i].id,
          bank_name: bank_on_the_fly[i].display_name_th,
          bank_logo:
            idp_logo != "" && idp_logo != null
              ? process.env.URL + idp_logo
              : process.env.URL + "/images/noimage.jpg",
          bank_mode: 1,
        });
      }
    });
  }

  return {
    bank_ndid: bank_ndid,
    bank_other: bank_other,
  };
}
