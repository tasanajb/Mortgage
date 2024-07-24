import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import sql from "mssql";
import axios from "axios";
import { snakeCaseKeys } from "../../utility";
import {
  Log_Api,
  Mapping_Loan,
  Master_Customer,
  Master_Loan,
  Mapping_Customer_Reserve,
  Master_Prefix,
  Master_Gender,
  Master_Married_Status,
  Master_Nationlity,
  Master_Occupation,
  Master_Education,
  Master_Unit,
  Master_Customer_Address,
  Master_Bareau,
  Master_Melfare,
  Master_Customer_Loan,
  Mapping_Loan_Bank,
  Master_File,
  Transaction_Document,
  Mapping_Customer_Unit,
  Master_Bank,
  Master_Business,
  Master_Developer,
  Transaction_Sms_Otp
} from "../../dbclass";
import _ from "lodash";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { fileResponse } from "../../models/FileResponse";
import * as validation from "../validation";
import { quotationFromRem } from "../externals/quotation";
import * as loan from "../externals/loan";
import { bankMatching } from "../externals/matching-sevice";
import {
  encryptionFileIdentifier,
  decryptionFileIdentifier,
} from "../../middlewares/file-authorization";

const account_name = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
if (!account_name) throw Error("Azure Storage accountName not found");
const accountKey = process.env.AZURE_STORAGE_KEY || "";

const shared_key_credential = new StorageSharedKeyCredential(
  account_name,
  accountKey
);
const blob_service_client = new BlobServiceClient(
  `https://${account_name}.blob.core.windows.net`,
  shared_key_credential
);

//** Borrower: ผู้กู้หลัก , Co-Borrower: ผู้กู้ร่วม **
//**  Master document_type **
// 1 : App
//    - หน้าใบสมัครสินเชื่อ
// 2 : เอกสารส่วนตัว
//    - สำเนาบัตรประชาชนหรือสำเนาบัตรข้าราชการ
//    - สำเนาทะเบียนบ้าน
//    - ใบเปลี่ยนชื่อ
// 3 : NCB
//    - หนังสือยินยอมให้ตรวจสอบข้อมูลเครดิต
// 4 : เอกสารรายได้
//    - สลิปเงินเดือน
//    - แบบภาษีเงินได้บุคคลธรรมดา
//    - ทวิ 50"
// 5 : Statement
// 6 : เอกสารหลักประกัน	"- ใบเสนอราคา
//    - ใบจอง
//    - สัญญาจะซื้อจะขาย
//    - สำเนาโฉนดที่ดิน/กรรมสิทธิ์ห้องชุด
//    - สำเนาทะเบียนบ้านหลักประกัน

// บันทึกข้อมูลที่ได้จากใบจอง
export const loanScanQrCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let trans = new sql.Transaction(pool);
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
    const check_ncb = await Master_Loan.findOne(createRequest(), {
      contract_id: contract_id,
      status: "inprogress",
    });

    if (check_ncb) {
      return res.status(400).send({
        status: 400,
        message:
          "ขออภัย รายการขอสินเชื่อของท่านได้ยื่นขอสินเชื่อไปแล้ว กรุณาตรวจสอบประวัติการทำรายการ",
      });
    }

    //** 1. ดึงข้อมูล ใบจองจาก REM From API External **
    let data_body: any = {
      customer_id: req.customer_id,
      data: data,
    };
    const quotation = await quotationFromRem(data_body);

    if (quotation.status != 200) {
      throw quotation;
    }

    const quotation_data = snakeCaseKeys(quotation.data);
    const loan_data = snakeCaseKeys(quotation_data.rem_booking);
    //2.1. Check ข้อมูล loan ว่ามีแล้วหรือยัง
    const check_loan = await Master_Loan.findOne(createRequest(), {
      booking_no: loan_data.booking_no,
      contract_id: loan_data.contract_id,
    });

    let loan_id = "";
    let loan_status = "";
    let type_of_borrower = "";
    let count_borrowers: number = loan_data.loan_customer.length;
    if (!check_loan) {
      //2.2. gen loan_id และ create loan
      const loan_runnumber = await createRequest()
        .input("RunKey", sql.NVarChar, "Loan")
        .input("KeyCode", sql.NVarChar, "LOAN")
        .input("CreateDate", sql.Date, new Date())
        .execute("sp_CreateRunning");

      loan_id = String(loan_runnumber.recordset[0]["RunKey"]);
      await Master_Loan.insert(createRequest(), {
        loan_id: loan_id,
        booking_no: loan_data.booking_no,
        contract_id: loan_data.contract_id,
        contract_no: loan_data?.contract_no || "",
        unit_id: loan_data?.collateral_info[0]?.unit_id,
        project_code: loan_data.project_code,
        developer_code: loan_data.developer,
        total_collateral_price: loan_data.total_collateral_price,
        request_amt: loan_data.request_amt,
        down_payment: loan_data.down_payment,
        book_amount: loan_data.book_amount,
        approve_date: loan_data.approve_date,
        book_date: loan_data.book_date,
        status: "active",
        sale_name: loan_data?.sale_manager_list[0]?.sale_name || "",
        sale_email: loan_data?.sale_manager_list[0]?.sale_email || "",
        count_borrowers: count_borrowers,
      });

      loan_status = "active";
    } else {
      loan_id = check_loan.loan_id;
      loan_status = check_loan.status;

      await Master_Loan.update(
        createRequest(),
        {
          booking_no: loan_data.booking_no,
          contract_id: loan_data.contract_id,
          contract_no: loan_data?.contract_no || "",
          unit_id: loan_data?.collateral_info[0]?.unit_id,
          project_code: loan_data.project_code,
          developer_code: loan_data.developer,
          total_collateral_price: loan_data.total_collateral_price,
          request_amt: loan_data.request_amt,
          down_payment: loan_data.down_payment,
          book_amount: loan_data.book_amount,
          approve_date: loan_data.approve_date,
          book_date: loan_data.book_date,
          sale_name: loan_data?.sale_manager_list[0]?.sale_name || "",
          sale_email: loan_data?.sale_manager_list[0]?.sale_email || "",
          count_borrowers: count_borrowers,
        },
        {
          loan_id: check_loan.loan_id,
        }
      );
    }

    //** 4. ผู้กู้ (ผู้กู้ร่วม และ หลัก) **
    // ตรวจสอบถสนะของสินเชื่อถ้ายังไม่มีการส่งข้อมูลไปยังธนาคารสามารถแก้ไข/เพิ่ม ข้อมูลได้
    if (loan_status === "active") {
      let unit_id = loan_data?.collateral_info[0]?.unit_id || "";
      // let unit_data = loan_data.collateral_info[0];
      // if (unit_data) {
      //   unit_id = unit_data.unit_id;
      //   const check_unit = await Master_Unit.findOne(createRequest(), {
      //     unit_id: unit_id,
      //     project_code: loan_data.project_code,
      //   });

      //   //3.4.1 check unit
      //   if (!check_unit) {
      //     await Master_Unit.insert(createRequest(), {
      //       unit_id: unit_id,
      //       unit_no: unit_data.unit_no,
      //       unit_type: String(unit_data.unit_type),
      //       unit_type_name: unit_data.unit_type_name,
      //       collateral_price: loan_data.total_collateral_price,
      //       title_deed_no: unit_data.title_deed_no,
      //       floor_no: unit_data.floor_no,
      //       zone_no: unit_data.zone_no,
      //       building_no: unit_data.building_no,
      //       model_name: unit_data.model_name,
      //       project_code: loan_data.project_code,
      //       project_name: loan_data.project_name,
      //     });
      //   } else {
      //     await Master_Unit.update(
      //       createRequest(),
      //       {
      //         unit_no: unit_data.unit_no,
      //         unit_type: String(unit_data?.unit_type),
      //         unit_type_name: unit_data.unit_type_name,
      //         collateral_price: loan_data.total_collateral_price,
      //         title_deed_no: unit_data.title_deed_no,
      //         floor_no: unit_data.floor_no,
      //         zone_no: unit_data.zone_no,
      //         building_no: unit_data.building_no,
      //         model_name: unit_data.model_name,
      //         update_date: new Date(),
      //       },
      //       {
      //         unit_id: unit_id,
      //         project_code: loan_data.project_code,
      //       }
      //     );
      //   }
      // }
      for (var i in loan_data.loan_customer) {
        await trans.begin();
        try {
          let borrower = loan_data.loan_customer[i];
          let seq_of_borrower = 0;

          //4.1. หาข้อมูลผู้กู้ จากหมายเลขบัตรประชาชน
          const check_customer = await Master_Customer.findOne(
            createRequest(),
            {
              citizen_id: borrower.citizen_id,
            }
          );

          //4.2. Insert or Update ข้อมูล customer
          let borrower_customer_id = "";
          if (!check_customer) {
            //4.2. Insert or Update ข้อมูลผู้กู้ ลง  Master_Customer (ข้อมูลทั่วไป)
            const customer_runnumber = await createRequest()
              .input("RunKey", sql.NVarChar, "Customer")
              .input("KeyCode", sql.NVarChar, "CUS")
              .input("CreateDate", sql.Date, new Date())
              .execute("sp_CreateRunning");

            borrower_customer_id = String(
              customer_runnumber.recordset[0]["RunKey"]
            );

            await Master_Customer.insert(createRequest(trans), {
              customer_id: borrower_customer_id,
              customer_id_rem: borrower?.customer_id,
              member_id: borrower?.member_id,
              citizen_id: borrower.citizen_id,
              prefix_id: borrower?.title_th_id,
              first_name: borrower?.firstname_th,
              last_name: borrower?.lastname_th,
              middle_name: borrower?.middlename_th,
              prefix_id_eng: borrower?.title_en_id || 0,
              first_name_eng: borrower?.firstname_en,
              last_name_eng: borrower?.lastname_en,
              middle_name_eng: borrower?.middlename_en,
              date_of_birth: borrower?.date_of_birth,
              nick_name: borrower?.nick_name || "",
              gender_code:
                borrower?.gender_code != ""
                  ? borrower?.gender_code
                  : borrower?.gender_name === "หญิง"
                    ? "F"
                    : borrower?.gender_name === "ชาย"
                      ? "M"
                      : "" || "",
              married_status_id: borrower?.marriage_status_id,
              age: String(borrower?.age),
              customer_type: borrower?.customer_type,
              nationality_id: borrower?.nationality_id,
              race_id: borrower?.race_id,
              ref_code: borrower?.ref_code,
              authority: borrower?.authority || "",
              citizen_date_of_issue:
                borrower?.doc_reference_effective_date || "",
              citizen_date_of_expiry: borrower?.doc_reference_expiry_date || "",
              passport_no: borrower?.passport_no || "",
              passport_country: borrower?.passport_country || "",
              //mobile_number: borrower.mobile_no, insert ตอนลงทะเบียน
              phone_number: borrower?.phone_no || "",
              inter_number: borrower?.inter_no || "",
              //email: borrower.email, insert ตอนลงทะเบียน
              facebook: borrower?.facebook || "",
              customer_line_id: borrower?.line_id || "",
              we_chat: borrower?.we_chat || "",
              whats_app: borrower?.whats_app || "",
              occupation_id: borrower?.occupation_id,
              company_name: borrower?.company_name || "",
              position: borrower?.position || "",
              work_number:
                borrower?.company_phone || borrower?.company_mobile || "",
              education_id: borrower?.education_id,
              first_job_start_date: borrower?.first_job_start_date,
              current_job_start_date: borrower?.current_job_start_date,
            });
          } else {
            borrower_customer_id = check_customer.customer_id;
            await Master_Customer.update(
              createRequest(trans),
              {
                customer_id_rem: borrower?.customer_id,
                member_id: borrower?.member_id,
                prefix_id: borrower?.title_th_id,
                //first_name: borrower?.firstname_th,
                //last_name: borrower?.lastname_th,
                middle_name: borrower?.middlename_th,
                prefix_id_eng: borrower?.title_en_id || 0,
                first_name_eng: borrower?.firstname_en,
                last_name_eng: borrower?.lastname_en,
                middle_name_eng: borrower?.middlename_en,
                date_of_birth: borrower?.date_of_birth,
                nick_name: borrower?.nick_name || "",
                gender_code:
                  borrower?.gender_code != ""
                    ? borrower?.gender_code
                    : borrower?.gender_name === "หญิง"
                      ? "F"
                      : borrower?.gender_name === "ชาย"
                        ? "M"
                        : "" || "",
                married_status_id: borrower?.marriage_status_id,
                age: String(borrower?.age),
                customer_type: borrower?.customer_type,
                nationality_id: borrower?.nationality_id,
                race_id: borrower?.race_id,
                ref_code: borrower?.ref_code,
                authority: borrower?.authority || "",
                citizen_date_of_issue:
                  borrower?.doc_reference_effective_date || "",
                citizen_date_of_expiry:
                  borrower?.doc_reference_expiry_date || "",
                passport_no: borrower?.passport_no || "",
                passport_country: borrower?.passport_country || "",
                //mobile_number: borrower.mobile_no, ไม่ให้อัพเดท
                phone_number: borrower?.phone_no || "",
                inter_number: borrower?.inter_no || "",
                //email: borrower.email, ไม่ให้อัพเดท
                facebook: borrower?.facebook || "",
                customer_line_id: borrower?.line_id || "",
                we_chat: borrower?.we_chat || "",
                whats_app: borrower?.whats_app || "",
                occupation_id: borrower?.occupation_id,
                company_name: borrower?.company_name || "",
                position: borrower?.position || "",
                work_number:
                  borrower?.company_phone || borrower?.company_mobile || "",
                education_id: borrower?.education_id,
                first_job_start_date: borrower?.first_job_start_date,
                current_job_start_date: borrower?.current_job_start_date,
                update_date: new Date(),
              },
              {
                customer_id: borrower_customer_id,
                citizen_id: borrower.citizen_id,
              }
            );
          }

          //4.3 check Master_Customer_Loan
          const customer_loan = await Master_Customer_Loan.findOne(
            createRequest(),
            {
              customer_id: borrower_customer_id,
              loan_id: loan_id,
            }
          );

          //4.3.1 หา grade_bureau_id and company_business_type_id
          const grade_bureau = await Master_Bareau.findOne(createRequest(), {
            name_th: borrower.grade_bureau,
          });

          const company_business_type = await Master_Business.findOne(
            createRequest(),
            {
              rem_code: borrower.company_business_type,
            }
          );

          let welfare_bank_type: any = [];
          if (!!borrower.welfare_bank_type) {
            let bank = borrower.welfare_bank_type;
            welfare_bank_type = _.map(bank, (n) => {
              const { bank_id } = n;
              return bank_id;
            });
          }

          if (!customer_loan) {
            await Master_Customer_Loan.insert(createRequest(), {
              number_of_house: String(borrower?.house_no) || "0",
              number_of_debt_house:
                String(borrower?.number_of_debt_house) || "0",
              company_business_type_id:
                company_business_type?.id != undefined
                  ? String(company_business_type?.id)
                  : null,
              company_business_type_name: borrower?.company_business_type_name,
              grade_bureau_id:
                grade_bureau?.id != undefined ? String(grade_bureau?.id) : null,
              grade_bureau_name: borrower?.grade_bureau,
              welfare_id: borrower?.welfare === "Yes" ? "1" : "2",
              welfare_name: borrower?.welfare_name,
              welfare_bank_type: JSON.stringify(welfare_bank_type),
              income: borrower?.income?.incomes || 0,
              ot: borrower?.income?.ot || 0,
              commission: borrower?.income?.commission || 0,
              bonus: borrower?.income?.bonus || 0,
              service_charge: borrower?.income?.service_charge || 0,
              perdiem: borrower?.income?.perdiem || 0,
              income_other_fix: borrower?.income?.income_other_fix || 0,
              income_other_not_fix: borrower?.income?.income_other_not_fix || 0,
              income_extra: borrower?.income?.income_extra || 0,
              income_rental: borrower?.income?.income_rental || 0,
              total_income: borrower?.income?.total_income || 0,
              pay_social_insurance: borrower?.pay?.pay_social_insurance || 0,
              pay_slip_tax: borrower?.pay?.pay_slip_tax || 0,
              pay_slip_cooperative: borrower?.pay?.pay_slip_cooperative || 0,
              pay_slip_other: borrower?.pay?.pay_slip_other || 0,
              pay_providentfund: borrower?.pay?.pay_providentfund || 0,
              pay_home_loan: borrower?.pay?.pay_home_loan || 0,
              pay_car_loan: borrower?.pay?.pay_car_loan || 0,
              debt_total_credit_card:
                borrower?.pay?.debt_total_credit_card || 0,
              debt_credit_card_per_month:
                borrower?.pay?.debt_credit_card_per_month || 0,
              debt_cash_card: 0, //rem ไม่มี
              debt_other: borrower?.pay?.debt_other || 0,
              total_debt: borrower?.pay?.total_debt || 0,
              customer_id: borrower_customer_id,
              loan_id: loan_id,
            });
          } else {
            await Master_Customer_Loan.update(
              createRequest(),
              {
                number_of_house: String(borrower?.house_no) || "0",
                number_of_debt_house:
                  String(borrower?.number_of_debt_house) || "0",
                company_business_type_id:
                  company_business_type?.id != undefined
                    ? String(company_business_type?.id)
                    : null,
                company_business_type_name:
                  borrower?.company_business_type_name,
                grade_bureau_id:
                  grade_bureau?.id != undefined
                    ? String(grade_bureau?.id)
                    : null,
                grade_bureau_name: borrower?.grade_bureau,
                welfare_id: borrower?.welfare === "Yes" ? "1" : "2",
                welfare_name: borrower?.welfare_name,
                welfare_bank_type: JSON.stringify(welfare_bank_type),
                income: borrower?.income?.incomes || 0,
                ot: borrower?.income?.ot || 0,
                commission: borrower?.income?.commission || 0,
                bonus: borrower?.income?.bonus || 0,
                service_charge: borrower?.income?.service_charge || 0,
                perdiem: borrower?.income?.perdiem || 0,
                income_other_fix: borrower?.income?.income_other_fix || 0,
                income_other_not_fix:
                  borrower?.income?.income_other_not_fix || 0,
                income_extra: borrower?.income?.income_extra || 0,
                income_rental: borrower?.income?.income_rental || 0,
                total_income: borrower?.income?.total_income || 0,
                pay_social_insurance: borrower?.pay?.pay_social_insurance || 0,
                pay_slip_tax: borrower?.pay?.pay_slip_tax || 0,
                pay_slip_cooperative: borrower?.pay?.pay_slip_cooperative || 0,
                pay_slip_other: borrower?.pay?.pay_slip_other || 0,
                pay_providentfund: borrower?.pay?.pay_providentfund || 0,
                pay_home_loan: borrower?.pay?.pay_home_loan || 0,
                pay_car_loan: borrower?.pay?.pay_car_loan || 0,
                debt_total_credit_card:
                  borrower?.pay?.debt_total_credit_card || 0,
                debt_credit_card_per_month:
                  borrower?.pay?.debt_credit_card_per_month || 0,
                debt_cash_card: 0, //rem ไม่มี
                debt_other: borrower?.pay?.debt_other || 0,
                total_debt: borrower?.pay?.total_debt || 0,
                update_date: new Date(),
              },
              {
                id: customer_loan.id,
                customer_id: borrower_customer_id,
                loan_id: loan_id,
              }
            );
          }

          //4.3. check map customer unit and insert
          const customer_unit = await Mapping_Customer_Unit.findOne(
            createRequest(),
            {
              customer_id: borrower_customer_id,
              unit_id: unit_id,
            }
          );

          if (!customer_unit) {
            await Mapping_Customer_Unit.insert(createRequest(trans), {
              customer_id: borrower_customer_id,
              unit_id: unit_id,
            });
          }

          //4.4. Check และ map loan กับผู้กู้ (type_of_borrower: "Borrower" ผู้กู้หลัก "Co-Borrower"ผู้กู้ร่วม, seq_of_borrower: ตามลำดับที่ insert ข้อมูล)
          const check_map_loan = await Mapping_Loan.findOne(createRequest(), {
            loan_id: loan_id,
            customer_id: borrower_customer_id,
          });
          let customer_reserve: any = [];

          if (borrower.other_contact[0].first_name != "") {
            customer_reserve = _.map(borrower.other_contact, (n) => {
              const {
                title_id,
                title_name,
                first_name,
                middle_name,
                last_name,
                relation_ship,
                relation_ship_other,
                mobile_no,
                email,
              } = n;

              return {
                reserve_prefix_id: title_id || "",
                reserve_prefix_name: title_name || "",
                reserve_first_name: first_name || "",
                reserve_middle_name: middle_name || "",
                reserve_last_name: last_name || "",
                reserve_relation_ship:
                  relation_ship != ""
                    ? relation_ship
                    : relation_ship_other || "",
                reserve_mobile_number: mobile_no || "",
                reserve_email: email || "",
                reserve_ref_customer_id: borrower_customer_id || "",
              };
            });
          }

          let customer_data: any = {
            customer: {
              customer_id: borrower_customer_id,
              citizen_id: borrower?.citizen_id || "",
              prefix_id: borrower?.title_th_id,
              prefix_Name: borrower?.title_th || "",
              first_name: borrower?.firstname_th || "",
              last_name: borrower?.lastname_th || "",
              middle_name: borrower?.middlename_th || "",
              prefix_id_eng: borrower?.title_en_id,
              prefix_name_eng: borrower?.title_en || "",
              first_name_eng: borrower?.firstname_en || "",
              last_name_eng: borrower?.lastname_en || "",
              middle_name_eng: borrower?.middlename_en || "",
              date_of_birth: borrower?.date_of_birth || "",
              nick_name: borrower?.nick_name || "",
              gender_code:
                borrower?.gender_code != ""
                  ? borrower?.gender_code
                  : borrower?.gender_name === "หญิง"
                    ? "F"
                    : borrower?.gender_name === "ชาย"
                      ? "M"
                      : "" || "",
              gender_name: borrower?.gender_name || "",
              married_status_id: borrower?.marriage_status_id,
              married_status_name: borrower?.marriage_status_name || "",
              age: borrower?.age || "",
              customer_type: borrower?.customer_type || "",
              nationality_id: borrower?.nationality_id,
              nationality_name: borrower?.nationality_name || "",
              race_id: borrower?.race_id,
              race_name: borrower?.race_name || "",
              ref_code: borrower?.ref_code || "",
              authority: borrower?.authority || "",
              citizen_date_of_issue:
                borrower?.doc_reference_effective_date || "",
              citizen_date_of_expiry: borrower?.doc_reference_expiry_date || "",
              passport_no: borrower?.passport_no || "",
              passport_country: borrower?.passport_country || "",
              mobile_number: borrower?.mobile_no || "",
              phone_number: borrower?.phone_no || "",
              inter_number: borrower?.inter_no || "",
              email: borrower?.email || "",
              facebook: borrower?.facebook || "",
              customer_line_id: borrower?.line_id || "",
              we_chat: borrower?.we_chat || "",
              whats_app: borrower?.whats_app || "",
              occupation_id: borrower?.occupation_id,
              occupation_name: borrower?.occupation_name || "",
              company_name: borrower?.company_name || "",
              position: borrower?.position || "",
              work_number:
                borrower?.company_phone || borrower?.company_mobile || "",
              education_id: borrower?.education_id,
              education_name: borrower?.education_name || "",
              first_job_start_date: borrower?.first_job_start_date || "",
              current_job_start_date: borrower?.current_job_start_date || "",
            },
            customer_reserve: customer_reserve,
          };

          if (!check_map_loan) {
            await Mapping_Loan.insert(createRequest(trans), {
              loan_id: loan_id,
              customer_id: borrower_customer_id,
              type_of_borrower: borrower.type_of_borrower,
              seq_of_borrower:
                borrower.type_of_borrower === "Borrower"
                  ? 0
                  : seq_of_borrower + 1,
              relation_with_borrower: borrower?.relation_ship || "",
              customer_address: JSON.stringify(borrower.address),
              customer_data: JSON.stringify(customer_data),
              mobile_number: borrower.mobile_no,
              email: borrower.email,
              status: "active",
            });
          } else {
            await Mapping_Loan.update(
              createRequest(trans),
              {
                customer_address: JSON.stringify(borrower.address),
                customer_data: JSON.stringify(customer_data),
                relation_with_borrower: borrower?.relation_ship || "",
                mobile_number: borrower.mobile_no,
                email: borrower.email,
                status: "active",
                update_date: new Date(),
              },
              {
                loan_id: loan_id,
                customer_id: borrower_customer_id,
              }
            );
          }

          await trans.commit();
        } catch (error) {
          if (trans) {
            await trans.rollback();
          }
          throw new Error(error);
        }
      }
    }

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        loan_id: loan_id,
        customer_id: req.customer_id,
        type_of_borrower: quotation_data.type_of_borrower,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/scan-qr",
      body: JSON.stringify(req.body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    res.status(error?.response?.status || error.status || 500).send({
      status: error?.response?.status || error.status || 500,
      message: error?.response?.data?.message || error.message,
    });
  }
};

export const loanlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //loan_type: 'ยื่นกู้จริง' 'Pre-approve'
    let loan_type = req?.body?.loan_type || 'ยื่นกู้จริง';
    //ดึงรายการขอสินเชื่อที่ยังไม่ได้ทำการยืนขอสินเชื่อ
    const loan_list = await createRequest().input(
      "customer_id",
      sql.NVarChar,
      req.customer_id
    ).input(
      "loan_type",
      sql.NVarChar,
      loan_type
    )
      .query(`
      SELECT t1.LoanId, t1.BookingNo, t1.ContractId, (case when ISNULL(t1.ContractNo,'') != '' then t1.ContractNo else '-' end) as ContractNo, 
      t4.DeveloperCode, t4.DeveloperName, t5.DeveloperImageUrl, t3.ProjectName, t3.UnitNo, t2.TypeOfBorrower, t1.LoanType
      FROM Master_Loan t1 
        INNER JOIN Mapping_Loan t2 ON t1.LoanId = t2.LoanId
        INNER JOIN Master_Unit t3 ON t1.UnitId = t3.UnitId
        INNER JOIN Master_Project t4 ON t3.ProjectCode = t4.ProjectCode
        INNER JOIN Master_Developer t5 ON t4.DeveloperCode = t5.DeveloperCode
      WHERE  t2.CustomerId = @customer_id AND t1.Status ='active' AND t1.LoanType = @loan_type
      ORDER BY t1.CreateDate desc
    `);

    res.status(200).send({
      status: 200,
      message: "success",
      data: snakeCaseKeys(loan_list.recordset),
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/list",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//ข้อมูลทั่วไป
export const loanDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    //ดึงข้อมูล unit และ ผู้กู้ร่วม
    const loan_detail: any = await getloanDetail(loan_id, req.customer_id);
    let unit = snakeCaseKeys(loan_detail.recordsets[0][0]);
    let co_borrower = snakeCaseKeys(loan_detail.recordsets[1]);

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        unit: unit,
        co_borrower: co_borrower || [],
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//Step1 : เอกสารเครดิต
export const loanDocNcb = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //document_type = 3  : NCB
    const { loan_id } = req.body;
    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });
    if (!check_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอสินเชื่อ",
      });
    }

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    //1. ดึงเอกสาร ncb
    const get_document_list = await createRequest()
      .input("customer_id", sql.NVarChar, req.customer_id)
      .input("loan_id", sql.NVarChar, loan_id).query(`
   SELECT t1.Id, t1.FileName, t1.FileSize, t1.FileType , t1.FileExtension, t1.GroupType, t1.RefType, t2.DeveloperCode,t1.Status
   FROM Master_File t1 
   INNER JOIN Master_Loan t2 ON t1.RefId = t2.LoanId 
   WHERE t1.RefId = @loan_id AND t1.CustomerId = @customer_id AND t1.GroupType = '3'
   order by t1.Status, t1.CreateDate desc
   `);
    let document_list_data = snakeCaseKeys(get_document_list.recordset);
    for (var i in document_list_data) {
      let file_id = await encryptionFileIdentifier(
        String(document_list_data[i].id)
      );
      document_list_data[i].id = file_id;
    }
    let document_list = _.map(document_list_data, (n) => new fileResponse(n));

    res.status(200).send({
      status: 200,
      message: "success",
      data: document_list[0] || {},
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/document-ncb/list",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanDocNcbUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (!validation.compareKeys(["loan_id", "file_document"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.docSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });
    //document_type = 3  : NCB
    const { loan_id, file_document } = req.body;
    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });

    if (!check_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอสินเชื่อ",
      });
    }

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }

    let document = file_document[0];
    let file_id = await decryptionFileIdentifier(String(document.id));
    await Master_File.update(
      createRequest(),
      {
        status: "active",
      },
      {
        id: parseInt(file_id),
        customer_id: req.customer_id,
        ref_id: loan_id,
        group_type: document.document_type || "3",
      }
    );

    res.status(200).send({
      status: 200,
      message: "อัปโหลดไฟล์เอกสาร ncb สำเร็จ",
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/document-ncb/upload",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

//Step2 : ข้อมูลผู้กู้
export const loanCustomerDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }
    //1.ข้อมูลผู้ขอสินเชื่อ และ ข้อมูลผู้ติดต่อสำรอง
    const customer_detail: any = await getCustomerDetail(
      loan_id,
      req.customer_id
    );

    // //2. get Prefix
    // let get_prefix_th = (await Master_Prefix.find(createRequest(), {
    //   language: "th",
    // })) as Array<Master_Prefix>;
    // let prefix_th = _.map(get_prefix_th, (n) => {
    //   let { id, text } = n;
    //   return {
    //     prefix_id: id,
    //     prefix_name: text,
    //   };
    // });

    // let get_prefix_eng = (await Master_Prefix.find(createRequest(), {
    //   language: "en",
    // })) as Array<Master_Prefix>;
    // let prefix_eng = _.map(get_prefix_eng, (n) => {
    //   let { id, text } = n;
    //   return {
    //     prefix_id: id,
    //     prefix_name_eng: text,
    //   };
    // });

    // //3. get gender
    // let get_gender = (await Master_Gender.find(
    //   createRequest(),
    //   {}
    // )) as Array<Master_Gender>;
    // let gender = _.map(get_gender, (n) => {
    //   let { id, name_th } = n;
    //   return {
    //     gender_id: id,
    //     gender_name: name_th,
    //   };
    // });

    // //4. get married status
    // let get_married_status = (await Master_Married_Status.find(
    //   createRequest(),
    //   {}
    // )) as Array<Master_Married_Status>;
    // let married_status = _.map(get_married_status, (n) => {
    //   let { id, name_th } = n;
    //   return {
    //     married_status_id: id,
    //     married_status_name: name_th,
    //   };
    // });

    // //5. get nationality
    // let get_nationality = (await Master_Nationlity.find(
    //   createRequest(),
    //   {}
    // )) as Array<Master_Nationlity>;
    // let nationality = _.map(get_nationality, (n) => {
    //   let { id, name_th } = n;
    //   return {
    //     nationality_id: id,
    //     nationality_name: name_th,
    //   };
    // });

    // //6. get occupation
    // let get_occupation = (await Master_Occupation.find(
    //   createRequest(),
    //   {}
    // )) as Array<Master_Occupation>;
    // let occupation = _.map(get_occupation, (n) => {
    //   let { id, name_th } = n;
    //   return {
    //     occupation_id: id,
    //     occupation_Name: name_th,
    //   };
    // });

    // //7. get education
    // let get_education = (await Master_Education.find(
    //   createRequest(),
    //   {}
    // )) as Array<Master_Education>;
    // let education = _.map(get_education, (n) => {
    //   let { id, name_th } = n;
    //   return {
    //     education_id: id,
    //     education_Name: name_th,
    //   };
    // });

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        customer: customer_detail?.customer || {},
        customer_reserve: customer_detail?.customer_reserve || [],
        // master: {
        //   prefix_th: prefix_th,
        //   prefix_eng: prefix_eng,
        //   gender: gender,
        //   married_status: married_status,
        //   nationality: nationality,
        //   occupation: occupation,
        //   education: education,
        // },
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanCustomerSave = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: req.body.loan_id,
    });
    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }

    const {
      prefix_id,
      prefix_Name,
      first_name,
      middle_name,
      last_name,
      prefix_id_eng,
      prefix_name_eng,
      first_name_eng,
      middle_name_eng,
      last_name_eng,
      date_of_birth,
      nick_name,
      gender_code,
      gender_name,
      married_status_id,
      married_status_name,
      age,
      customer_type,
      nationality_id,
      nationality_name,
      race_id,
      race_name,
      ref_code,
      citizen_id,
      authority,
      citizen_date_of_issue,
      citizen_date_of_expiry,
      passport_no,
      passport_country,
      mobile_number,
      phone_number,
      inter_number,
      email,
      facebook,
      customer_line_id,
      we_chat,
      whats_app,
      occupation_id,
      occupation_name,
      company_name,
      position,
      work_number,
      education_id,
      education_name,
      first_job_start_date,
      current_job_start_date,
      type_of_borrower,
      relation_ship,
    } = req.body.customer;

    const {
      reserve_prefix_id,
      reserve_first_name,
      reserve_last_name,
      reserve_married_status_id,
      reserve_mobile_number,
      reserve_email,
    } = req.body.customer_reserve;



    //1.update ข้อมูลผู้ขอสินเชื่อ ** ปกติแก้ไขไม่ได้ยึดตามใบจอง
    await Master_Customer.update(
      createRequest(),
      {
        prefix_id: prefix_id,
        prefix_id_eng: prefix_id,
        first_name: first_name,
        middle_name: middle_name,
        last_name: last_name,
        first_name_eng: first_name_eng,
        middle_name_eng: middle_name_eng,
        last_name_eng: last_name_eng,
        date_of_birth: date_of_birth,
        nick_name: nick_name,
        gender_code: gender_code,
        married_status_id: married_status_id,
        age: age,
        customer_type: customer_type,
        nationality_id: nationality_id,
        race_id: race_id,
        ref_code: ref_code,
        authority: authority,
        citizen_date_of_issue: citizen_date_of_issue,
        citizen_date_of_expiry: citizen_date_of_expiry,
        passport_no: passport_no,
        passport_country: passport_country,
        mobile_number: mobile_number,
        phone_number: phone_number,
        inter_number: inter_number,
        email: email,
        facebook: facebook,
        customer_line_id: customer_line_id,
        we_chat: we_chat,
        whats_app: whats_app,
        occupation_id: occupation_id,
        company_name: company_name,
        position: position,
        work_number: work_number,
        education_id: education_id,
        first_job_start_date: first_job_start_date,
        current_job_start_date: current_job_start_date,
        update_date: new Date(),
      },
      {
        customer_id: req.customer_id,
        citizen_id: citizen_id,
      }
    );


    const check_customer_reserve = await Mapping_Customer_Reserve.findOne(createRequest(), {
      ref_customer_id: req.customer_id,
    });

    if (!check_customer_reserve) {
      //2. insert ข้อมูลผู้ติดต่อสำรอง
      await Mapping_Customer_Reserve.insert(
        createRequest(),
        {
          prefix_id: reserve_prefix_id,
          first_name: reserve_first_name,
          last_name: reserve_last_name,
          married_status_id: reserve_married_status_id,
          mobile_number: reserve_mobile_number,
          email: reserve_email,
          ref_customer_id: req.customer_id,
        }
      );
    }

    const check_map_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: req.body.loan_id.loan_id,
      customer_id: req.customer_id,
    });

    let customer_data: any = {
      customer: {
        customer_id: req.customer_id,
        citizen_id: citizen_id || "",
        prefix_id: prefix_id,
        prefix_Name: prefix_Name || "",
        first_name: first_name || "",
        last_name: last_name || "",
        middle_name: middle_name || "",
        prefix_id_eng: prefix_id_eng,
        prefix_name_eng: prefix_name_eng || "",
        first_name_eng: first_name_eng || "",
        last_name_eng: last_name_eng || "",
        middle_name_eng: middle_name_eng || "",
        date_of_birth: date_of_birth || "",
        nick_name: nick_name || "",
        gender_code: gender_code || "N",
        gender_name: gender_name || "ไม่มี",
        married_status_id: married_status_id,
        married_status_name: married_status_name || "",
        age: age || "",
        customer_type: customer_type || "",
        nationality_id: nationality_id,
        nationality_name: nationality_name || "",
        race_id: race_id,
        race_name: race_name || "",
        ref_code: ref_code || "",
        authority: authority || "",
        citizen_date_of_issue: citizen_date_of_issue || "",
        citizen_date_of_expiry: citizen_date_of_expiry || "",
        passport_no: passport_no || "",
        passport_country: passport_country || "",
        mobile_number: mobile_number || "",
        phone_number: phone_number || "",
        inter_number: inter_number || "",
        email: email || "",
        facebook: facebook || "",
        customer_line_id: customer_line_id || "",
        we_chat: we_chat || "",
        whats_app: whats_app || "",
        occupation_id: occupation_id,
        occupation_name: occupation_name || "",
        company_name: company_name || "",
        position: position || "",
        work_number: work_number || "",
        education_id: education_id,
        education_name: education_name || "",
        first_job_start_date: first_job_start_date || "",
        current_job_start_date: current_job_start_date || "",
      },
      customer_reserve: req.body.customer_reserve
    };

    if (!check_map_loan) {
      const find_borrower = await Mapping_Loan.find(createRequest(), {
        type_of_borrower: "Co-Borrower",
        status: "active",
        loan_id: req.body.loan_id,
      });

      let seq_of_borrower = find_borrower.length || 0;
      await Mapping_Loan.insert(createRequest(), {
        loan_id: req.body.loan_id,
        customer_id: req.customer_id,
        type_of_borrower: type_of_borrower,
        seq_of_borrower:
          type_of_borrower === "Borrower"
            ? 0
            : seq_of_borrower + 1,
        relation_with_borrower: relation_ship || "",
        //customer_address: JSON.stringify(borrower.address),
        customer_data: JSON.stringify(customer_data),
        mobile_number: mobile_number,
        email: email,
        status: "active",
      });
    } else {
      await Mapping_Loan.update(
        createRequest(),
        {
          //customer_address: JSON.stringify(borrower.address),
          customer_data: JSON.stringify(customer_data),
          relation_with_borrower: relation_ship || "",
          mobile_number: mobile_number,
          email: email,
          status: "active",
          update_date: new Date(),
        },
        {
          loan_id: req.body.loan_id,
          customer_id: req.customer_id,
        }
      );
    }

    res.status(200).send({
      status: 200,
      message: "บันทึกข้อมูลผู้กู้สำเร็จ",
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer/save",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//Step3 : ข้อมูลที่อยู่
export const loanAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }
    const customer_address = await getCustomerAddress(loan_id, req.customer_id);

    res.status(200).send({
      status: 200,
      message: "success",
      data: customer_address || [],
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/address/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanAddressSave = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      loan_id,
      address
    } = req.body;
    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });
    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }

    const customer_address = await Master_Customer_Address.find(
      createRequest(),
      {
        customer_id: req.customer_id,
      }
    );

    for (var i in req.body) {
      let address_data = req.body.address[i];
      let elementIndex = customer_address.findIndex(
        (element: any) =>
          element.address_type_name === address_data.address_type_name
      );
      if (elementIndex >= 0) {
        await Master_Customer_Address.update(
          createRequest(),
          {
            address: address_data.address,
            soi: address_data.soi,
            road: address_data.road,
            sub_district_id: address_data.sub_district_id,
            sub_district_name: address_data.sub_district_name,
            district_id: address_data.district_id,
            district_name: address_data.district_name,
            province_id: address_data.province_id,
            province_name: address_data.province_name,
            post_code: address_data.post_code,
            update_date: new Date(),
          },
          {
            customer_id: req.customer_id,
            address_type_name: address_data.address_type_name,
          }
        );
      } else {
        await Master_Customer_Address.insert(createRequest(), {
          address: address_data.address,
          soi: address_data.soi,
          road: address_data.road,
          sub_district_id: address_data.sub_district_id,
          sub_district_name: address_data.sub_district_name,
          district_id: address_data.district_id,
          district_name: address_data.district_name,
          province_id: address_data.province_id,
          province_name: address_data.province_name,
          post_code: address_data.post_code,
          customer_id: req.customer_id,
          address_type: address_data.address_type,
          address_type_name: address_data.address_type_name,
        });
      }
    }

    await Mapping_Loan.update(
      createRequest(),
      {
        customer_address: JSON.stringify(address || []),
        update_date: new Date(),
      },
      {
        loan_id: loan_id,
        customer_id: req.customer_id,
      }
    );

    res.status(200).send({
      status: 200,
      message: "บันทึกที่อยู่สำเร็จ",
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/address/save",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//Step4 : ข้อมูลการขอสินเชื่อ
export const loanCustomerLoanDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }
    //1.ข้อมูลการขอสินเชื่อ (ส่วน เอกสารหลัก)
    const customer_loan_detail = await getCustomerLoanDetail(
      loan_id,
      req.customer_id
    );

    //2. get ประเภทธุรกิจที่ทำงาน
    let get_business = (await Master_Business.find(
      createRequest(),
      {}
    )) as Array<Master_Business>;
    let company_business_type = _.map(get_business, (n) => {
      let { id, name_th } = n;
      return {
        company_business_type_id: id,
        company_business_type_name: name_th,
      };
    });

    //3. get เกรด Bureau
    let get_bureau = (await Master_Bareau.find(
      createRequest(),
      {}
    )) as Array<Master_Bareau>;
    let grade_bureau = _.map(get_bureau, (n) => {
      let { id, name_th } = n;
      return {
        grade_bureau_id: id,
        grade_bureau_name: name_th,
      };
    });

    //4. get สวัสดิการ
    let get_melfare = (await Master_Melfare.find(
      createRequest(),
      {}
    )) as Array<Master_Melfare>;
    let melfare = _.map(get_melfare, (n) => {
      let { id, name_th } = n;
      return {
        melfare_id: id,
        melfare_name: name_th,
      };
    });

    //5. get master bank
    let get_bank = (await Master_Bank.find(createRequest(), {
      status: "active",
    })) as Array<Master_Bank>;
    let bank = _.map(get_bank, (n) => {
      let { bank_code, name } = n;
      return {
        bank_code: bank_code,
        bank_name: name,
      };
    });

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        customer_loan: customer_loan_detail,
        master: {
          company_business_type: company_business_type,
          grade_bureau: grade_bureau,
          melfare: melfare,
          bank: bank,
        },
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer-loan/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanCustomerLoanSave = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let trans = new sql.Transaction(pool);
  try {
    await trans.begin();
    //compare request data and validation
    if (
      !validation.compareKeys(
        [
          "loan_id",
          "number_of_house",
          "number_of_debt_house",
          "company_business_type_id",
          "grade_bureau_id",
          "welfare_id",
          "welfare_bank_type",
        ],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.customerLoanSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const {
      loan_id,
      number_of_house,
      number_of_debt_house,
      company_business_type_id,
      grade_bureau_id,
      welfare_id,
      welfare_bank_type = [] as any,
    } = req.body;
    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });
    if (!check_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอสินเชื่อ",
      });
    }

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }

    const company_business_type = await Master_Business.findOne(
      createRequest(),
      {
        id: parseInt(company_business_type_id),
      }
    );

    const grade_bureau = await Master_Bareau.findOne(createRequest(), {
      id: parseInt(grade_bureau_id),
    });

    const welfare = await Master_Melfare.findOne(createRequest(), {
      id: parseInt(welfare_id),
    });

    //1. Check ข้อมูลขอสินเชื่อ
    const customer_loan = await Master_Customer_Loan.findOne(createRequest(), {
      customer_id: req.customer_id,
      loan_id: loan_id,
    });

    //2. บันทึกข้อมูลการขอสินเชื่อ
    if (!customer_loan) {
      await Master_Customer_Loan.insert(createRequest(trans), {
        number_of_house: number_of_house,
        number_of_debt_house: number_of_debt_house,
        company_business_type_id: company_business_type_id,
        company_business_type_name: company_business_type?.name_th || "",
        grade_bureau_id: grade_bureau_id,
        grade_bureau_name: grade_bureau?.name_th || "",
        welfare_id: welfare_id,
        welfare_name: welfare?.name_th || "",
        welfare_bank_type: JSON.stringify(welfare_bank_type),
        customer_id: req.customer_id,
        loan_id: loan_id,
      });
    } else {
      await Master_Customer_Loan.update(
        createRequest(trans),
        {
          number_of_house: number_of_house,
          number_of_debt_house: number_of_debt_house,
          company_business_type_id: company_business_type_id,
          company_business_type_name: company_business_type?.name_th || "",
          grade_bureau_id: grade_bureau_id,
          grade_bureau_name: grade_bureau?.name_th || "",
          welfare_id: welfare_id,
          welfare_name: welfare?.name_th || "",
          welfare_bank_type: JSON.stringify(welfare_bank_type),
        },
        {
          customer_id: req.customer_id,
          loan_id: loan_id,
        }
      );
    }
    await trans.commit();
    res.status(200).send({
      status: 200,
      message: "บันทึกข้อมูลการขอสินเชื่อสำเร็จ",
    });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer-loan/save",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

//Step5 : รายได้
export const loanCustomerIncomeDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    //1. ดึงข้อมูลรายได้
    const customer_loan_income = await getCustomerIncome(
      loan_id,
      req.customer_id
    );

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        customer_loan: customer_loan_income,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer-loan/income/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanCustomerIncomeSave = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let trans = new sql.Transaction(pool);
  try {
    await trans.begin();
    //compare request data and validation
    if (
      !validation.compareKeys(
        [
          "loan_id",
          "income",
          "ot",
          "commission",
          "bonus",
          "service_charge",
          "perdiem",
          "income_other_fix",
          "income_other_not_fix",
          "income_extra",
          "income_rental",
          "total_income",
        ],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.incomeSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const {
      loan_id,
      income,
      ot,
      commission,
      bonus,
      service_charge,
      perdiem,
      income_other_fix,
      income_other_not_fix,
      income_extra,
      income_rental,
      total_income,
    } = req.body;

    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });

    if (!check_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอสินเชื่อ",
      });
    }

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }
    //1. Check ข้อมูลขอสินเชื่อ
    const customer_loan_income = await Master_Customer_Loan.findOne(
      createRequest(),
      {
        customer_id: req.customer_id,
        loan_id: loan_id,
      }
    );

    //2. บันทึกข้อมูลการขอสินเชื่อ
    if (!customer_loan_income) {
      await Master_Customer_Loan.insert(createRequest(), {
        income: income,
        ot: ot,
        commission: commission,
        bonus: bonus,
        service_charge: service_charge,
        perdiem: perdiem,
        income_other_fix: income_other_fix,
        income_other_not_fix: income_other_not_fix,
        income_extra: income_extra,
        income_rental: income_rental,
        total_income: total_income,
        customer_id: req.customer_id,
        loan_id: loan_id,
      });
    } else {
      await Master_Customer_Loan.update(
        createRequest(trans),
        {
          income: income,
          ot: ot,
          commission: commission,
          bonus: bonus,
          service_charge: service_charge,
          perdiem: perdiem,
          income_other_fix: income_other_fix,
          income_other_not_fix: income_other_not_fix,
          income_extra: income_extra,
          income_rental: income_rental,
          total_income: total_income,
        },
        {
          customer_id: req.customer_id,
          loan_id: loan_id,
        }
      );
    }
    await trans.commit();
    res.status(200).send({
      status: 200,
      message: "บันทึกข้อมูลรายได้สำเร็จ",
    });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer-loan/income/save",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

//Step6 : รายจ่าย
export const loanCustomerPayDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;
    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    //1. ดึงข้อมูลรายจ่าย
    const customer_loan_pay = await getCustomerPay(loan_id, req.customer_id);

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        customer_loan: customer_loan_pay,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer-loan/pay/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanCustomerPaySave = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //let trans = new sql.Transaction(pool);
  try {
    //await trans.begin();
    //compare request data and validation
    if (
      !validation.compareKeys(
        [
          "loan_id",
          "pay_social_insurance",
          "pay_slip_tax",
          "pay_slip_cooperative",
          "pay_slip_other",
          "pay_providentfund",
          "pay_home_loan",
          "pay_car_loan",
          "debt_total_credit_card",
          "debt_credit_card_per_month",
          "debt_cash_card",
          "debt_other",
          "total_debt",
        ],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.paySchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const {
      loan_id,
      pay_social_insurance,
      pay_slip_tax,
      pay_slip_cooperative,
      pay_slip_other,
      pay_providentfund,
      pay_home_loan,
      pay_car_loan,
      debt_total_credit_card,
      debt_credit_card_per_month,
      debt_cash_card,
      debt_other,
      total_debt,
    } = req.body;

    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });
    if (!check_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอสินเชื่อ",
      });
    }

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }

    const get_borrower = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    //1. Check ข้อมูลขอสินเชื่อ
    const customer_loan_pay = await Master_Customer_Loan.findOne(
      createRequest(),
      {
        customer_id: req.customer_id,
        loan_id: loan_id,
      }
    );

    //2. บันทึกข้อมูลการขอสินเชื่อ
    if (!customer_loan_pay) {
      await Master_Customer_Loan.insert(createRequest(), {
        pay_social_insurance: pay_social_insurance,
        pay_slip_tax: pay_slip_tax,
        pay_slip_cooperative: pay_slip_cooperative,
        pay_slip_other: pay_slip_other,
        pay_providentfund: pay_providentfund,
        pay_home_loan: pay_home_loan,
        pay_car_loan: pay_car_loan,
        debt_total_credit_card: debt_total_credit_card,
        debt_credit_card_per_month: debt_credit_card_per_month,
        debt_cash_card: debt_cash_card,
        debt_other: debt_other,
        total_debt: total_debt,
        customer_id: req.customer_id,
        loan_id: loan_id,
      });
    } else {
      await Master_Customer_Loan.update(
        createRequest(),
        {
          pay_social_insurance: pay_social_insurance,
          pay_slip_tax: pay_slip_tax,
          pay_slip_cooperative: pay_slip_cooperative,
          pay_slip_other: pay_slip_other,
          pay_providentfund: pay_providentfund,
          pay_home_loan: pay_home_loan,
          pay_car_loan: pay_car_loan,
          debt_total_credit_card: debt_total_credit_card,
          debt_credit_card_per_month: debt_credit_card_per_month,
          debt_cash_card: debt_cash_card,
          debt_other: debt_other,
          total_debt: total_debt,
        },
        {
          customer_id: req.customer_id,
          loan_id: loan_id,
        }
      );
    }

    //await trans.commit();

    //3. ธนาคารที่ควดว่าจะกู้ผ่าน
    //3.1. หาว่า customer นี้เป็นผู้กูหลักหรือไม่ ถ้าใช่(Borrower)ทำต่อ ไม่ใช่(Co-Borrower)จบflow ( เฉพาะผู้กู้หลักเท่านั้น )
    let bank: any = [];
    if (get_borrower.type_of_borrower === "Borrower") {
      //3.2. Map loan bank ไว้สำหรับรอเลือก bank
      // //3.2.1. ดึงข้อมูลผู้สินเชื่อทั้งหมด
      const get_all_borrower = await createRequest().input(
        "loan_id",
        sql.NVarChar,
        loan_id
      ).query(`
      SELECT t2.CitizenId as UserId, t2.Age
      FROM Mapping_Loan t1
      INNER JOIN Master_Customer t2 ON t1.CustomerId = t2.CustomerId
      WHERE t1.LoanId = @loan_id`);

      if (get_all_borrower.recordset.length == 0) {
        throw {
          status: 400,
          message: "ขออภัย ไม่พบข้อมูลผู้ขอสินเชื่อ",
        };
      }

      //3.2.2. ดึง bank ที่โครงการนั้นๆเปิด จาก rem ex.["GHB", "GSB", "SCB"]
      let bank_matching_data: any = {
        loan_id: check_loan.loan_id,
        developer_code: check_loan.developer_code,
        project_code: check_loan.project_code,
        loan_customer: snakeCaseKeys(get_all_borrower.recordset) || [],
        bank: [],
      };

      //3.2.3. matching bank
      const bank_matching = await bankMatching(bank_matching_data);

      if (bank_matching.status !== 200) {
        throw {
          status: 400,
          message:
            "ขออภัย เกิดข้อผิดพลาดในการหาธนาคารที่สามารถกู้ผ่าน กรุณาลองใหม่อีกครั้ง",
        };
      }

      let bank_for_loan: any = bank_matching.data.data.bank_for_loan || [];
      //3.3. ลบ map loan bank เดิมออกทั้งหมด
      await Mapping_Loan_Bank.delete(createRequest(), {
        loan_id: loan_id,
        customer_id: req.customer_id,
        is_select_bank: false,
      });

      for (var i in bank_for_loan) {
        let bank_code = String(bank_for_loan[i]);
        //3.4. Insert map loan bank
        await Mapping_Loan_Bank.insert(createRequest(), {
          bank_code: bank_code,
          loan_id: loan_id,
          customer_id: req.customer_id,
          is_select_bank: false,
        });

        const bank_data = await Master_Bank.findOne(createRequest(), {
          bank_code: bank_code,
        });

        if (bank_data) {
          bank.push({
            bank_code: bank_code,
            bank_name: bank_data.name,
            bank_logo:
              bank_data.bank_logo != "" && bank_data.bank_logo != null
                ? process.env.URL + bank_data.bank_logo
                : process.env.URL + "/images/noimage.jpg",
            is_select_bank: false,
          });
        }
      }
    }

    res.status(200).send({
      status: 200,
      message: "บันทึกข้อมูลรายจ่ายสำเร็จ",
      data: { bank: bank },
    });
  } catch (error) {
    // if (trans) {
    //   await trans.rollback();
    // }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/customer-loan/income/save",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

//Step7 : อัปโหลดเอกสาร
export const loanDocList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;
    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    //1. get list document
    const file_document = await getDocList(loan_id, req.customer_id);

    res.status(200).send({
      status: 200,
      message: "success",
      data: file_document || [],
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/document/list",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanDocUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (!validation.compareKeys(["loan_id", "file_document"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.docSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });
    const { loan_id, file_document } = req.body;
    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });
    if (!check_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอสินเชื่อ",
      });
    }

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }

    for (var i in file_document) {
      let document = file_document[i];
      let file_id = await decryptionFileIdentifier(String(document.id));
      //update Master_File
      await Master_File.update(
        createRequest(),
        {
          status: "active",
        },
        {
          id: parseInt(file_id),
          customer_id: req.customer_id,
          ref_id: loan_id,
          group_type: document.document_type,
        }
      );
    }

    res.status(200).send({
      status: 200,
      message: "อัปโหลดไฟล์เอกสารสำเร็จ",
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/document/upload",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

//Step8 : เลือกธนาคาร
export const loanSelectBankList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;
    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }
    //1. ดึงรายการธนาคารที่สามารถกู้ได้
    const get_bank = await createRequest()
      .input("customer_id", sql.NVarChar, req.customer_id)
      .input("loan_id", sql.NVarChar, loan_id).query(`
    SELECT t2.BankCode , t2.Name as BankName, t2.BankLogo , t1.IsSelectBank
    FROM Mapping_Loan_Bank t1 
    INNER JOIN Master_bank t2 ON t1.BankCode = t2.BankCode
    WHERE t1.LoanId = @loan_id AND CustomerId = @customer_id
    `);

    let marter_bank = await _.map(
      snakeCaseKeys(get_bank.recordset),
      (n: any) => {
        let { bank_code, bank_name, bank_logo, is_select_bank } = n;
        return {
          bank_code: bank_code,
          bank_name: bank_name,
          bank_logo:
            bank_logo != "" && bank_logo != null
              ? process.env.URL + bank_logo
              : process.env.URL + "/images/noimage.jpg",
          is_select_bank: is_select_bank,
        };
      }
    );

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        bank: marter_bank || [],
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/select-bank/list",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const loanSelectBankSave = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let trans = new sql.Transaction(pool);
  try {
    await trans.begin();
    //compare request data and validation
    if (!validation.compareKeys(["loan_id", "select_bank", "pin"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.selectBankSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { loan_id, select_bank } = req.body;

    const check_loan = await Master_Loan.findOne(createRequest(), {
      loan_id: loan_id,
    });
    if (!check_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลการขอสินเชื่อ",
      });
    }

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนี้",
      });
    }

    if (check_loan.status !== "active") {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากท่านได้ทำการยื่นขอสินเชื่อไปยังธนาคารที่เลือกแล้ว",
      });
    }

    //ex. select_bank = [ "KBANK","SCB"];

    //1. ส่งข้อมูลการเลือกธนาคาร ข้อมูลการข้อสินเชื่อไปยัง rem
    const send_to_rem = await loan.addNewLoanToRem(
      loan_id,
      select_bank,
      check_loan.developer_code
    );
    if (send_to_rem.status != 200) {
      throw send_to_rem;
    }
    //2. update ข้อมูลการเลือกธนาคาร
    await createRequest()
      .input("customer_id", sql.NVarChar, req.customer_id)
      .input("loan_id", sql.NVarChar, loan_id)
      .input("select_bank", sql.NVarChar, select_bank.join(","))
      .query(
        `
        DECLARE @TempTable TABLE (Bank NVARCHAR(50))
        
        INSERT INTO @TempTable (Bank) SELECT value FROM STRING_SPLIT(@select_bank, ',')
        UPDATE Mapping_Loan_Bank
        SET IsSelectBank = 1
        WHERE LoanId = @loan_id AND CustomerId = @customer_id AND BankCode IN( SELECT Bank FROM @TempTable)`
      );

    //3. update status loan (สถานะรอตรวจสอบ และเลือกธนาคาร)
    await Master_Loan.update(
      createRequest(trans),
      {
        status: "inprogress",
        update_date: new Date(),
      },
      {
        loan_id: loan_id,
      }
    );
    await trans.commit();
    res.status(200).send({
      status: 200,
      message: "เลือกธนาคารสำเร็จ",
    });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/select-bank/save",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

//ประวัติธนาคารที่ยื่นกู้
export const loanHistoryIsSelectBank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }
    //1. ดึงรายการธนาคารที่ยื่นกู้
    const get_bank = await getIsSelectBank(loan_id, req.customer_id);

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        bank: get_bank || [],
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/history/select-bank/list",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

//รายการประวัติขอสินเชื่อ
export const loanHistorylist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //ดึงรายการประวัติขอสินเชื่อ
    const loan_list = await createRequest().input(
      "customer_id",
      sql.NVarChar,
      req.customer_id
    ).query(`
      SELECT t1.LoanId, t1.BookingNo, t1.ContractId, (case when ISNULL(t1.ContractNo,'') != '' then t1.ContractNo else '-' end) as ContractNo, t4.DeveloperCode, t4.DeveloperName, t5.DeveloperImageUrl, t3.ProjectName, t3.UnitNo, t2.TypeOfBorrower
      FROM Master_Loan t1 
        INNER JOIN Mapping_Loan t2 ON t1.LoanId = t2.LoanId
        INNER JOIN Master_Unit t3 ON t1.UnitId = t3.UnitId
        INNER JOIN Master_Project t4 ON t3.ProjectCode = t4.ProjectCode
        INNER JOIN Master_Developer t5 ON t4.DeveloperCode = t5.DeveloperCode
      WHERE  t2.CustomerId = @customer_id AND t1.Status = 'inprogress'
      ORDER BY t1.UpdateDate desc
    `);

    res.status(200).send({
      status: 200,
      message: "success",
      data: snakeCaseKeys(loan_list.recordset),
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/history/list",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//รายละเอียดประวัติการขอสินเชื่อรวมทุกหน้า
export const loanHistoryDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;

    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    //1. ข้อมูลทั่วไป
    const loan_detail: any = await getloanDetail(loan_id, req.customer_id);
    let unit = snakeCaseKeys(loan_detail.recordsets[0][0]);
    let co_borrower = snakeCaseKeys(loan_detail.recordsets[1]);
    let borrower = snakeCaseKeys(loan_detail.recordsets[2][0]);

    //2. ข้อมูลผู้กู้
    const customer_detail: any = await getCustomerDetail(
      loan_id,
      req.customer_id
    );

    //3. ที่อยู่
    const customer_address = await getCustomerAddress(loan_id, req.customer_id);

    //4. ข้อมูลการขอสินเชื่อ
    const customer_loan_detail = await getCustomerLoanDetail(
      loan_id,
      req.customer_id
    );

    //5. รายได้
    const customer_loan_income = await getCustomerIncome(
      loan_id,
      req.customer_id
    );

    //6. รายจ่าย
    const customer_loan_pay = await getCustomerPay(loan_id, req.customer_id);

    //7. ธนาคารที่ยื่นกู้
    const get_bank = await getIsSelectBank(loan_id, req.customer_id);

    //8. เอกสารแนบ
    const file_document = await getDocList(loan_id, req.customer_id);

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        unit: unit,
        loan_customer: {
          borrower: borrower || {},
          co_borrower: co_borrower || [],
        },
        customer: customer_detail.customer,
        customer_reserve: customer_detail.customer_reserve,
        customer_address: customer_address,
        customer_loan_detail: customer_loan_detail,
        customer_loan_income: customer_loan_income,
        customer_loan_pay: customer_loan_pay,
        bank: get_bank || [],
        file_document: file_document || [],
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/history/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//ประวัติข้อมูลทั่วไป
export const loanHistoryUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;
    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }
    //ดึงข้อมูล unit และ ผู้กู้ร่วม
    const loan_detail: any = await getloanDetail(loan_id, req.customer_id);
    let unit = snakeCaseKeys(loan_detail.recordsets[0][0]);

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        unit: unit,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/history/unit/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//ประวัติข้อมูลรายชื่อผู้กู้ทั้งหมด
export const loanHistoryLoanCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loan_id } = req.body;
    const check_cus_loan = await Mapping_Loan.findOne(createRequest(), {
      loan_id: loan_id,
      customer_id: req.customer_id,
    });

    if (!check_cus_loan) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลของท่านในหมายเลขสินเชื่อนนี้",
      });
    }

    //ดึงข้อมูล unit และ ผู้กู้ร่วม
    const loan_detail: any = await getloanDetail(loan_id, req.customer_id);
    let co_borrower = snakeCaseKeys(loan_detail.recordsets[1]);
    let borrower = snakeCaseKeys(loan_detail.recordsets[2][0]);

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        borrower: borrower || {},
        co_borrower: co_borrower || [],
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/history/loan-customer/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

//********  เช็คสถานะสินเชื่อ ***************/
//list รายการขอสินเชื่อ
export const loanStatusList = async (
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

    let data_body: any = {
      citizen_id: customer_data.citizen_id,
    };
    const get_loan_list = await loan.loanAll(data_body);

    if (get_loan_list.status != 200) {
      throw get_loan_list;
    }
    const get_developer = await Master_Developer.find(createRequest(), {});

    let loan_list: any = [];
    for (var i in get_loan_list.data) {
      let image_url = "";
      _.find(get_developer, function (n: any) {
        if (n.developer_code === get_loan_list.data[i]["developer_id"]) {
          image_url = n.developer_image_url || "";
        }
      });
      loan_list.push({
        ...get_loan_list.data[i],
        developer_image_url: image_url,
      });
    }

    res.status(200).send({
      status: 200,
      message: "success",
      data: loan_list || [],
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/loan-status/list",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

//รายละเอียดรายการขอสินเชื่อ
export const loanStatusDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { unit_id, unit_no, booking_no } = req.body;
    const customer_data = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });
    if (!customer_data) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูล",
      });
    }

    let data_body: any = {
      citizen_id: customer_data.citizen_id,
      unit_id: unit_id,
      unit_no: unit_no,
      booking_no: booking_no,
    };
    const get_loan_detail = await loan.loanDetail(data_body);

    if (get_loan_detail.status != 200) {
      throw get_loan_detail;
    }

    const get_bank = await Master_Bank.find(createRequest(), {
      //status: "active",
    });

    let loan_detail: any = get_loan_detail.data[0];
    let bank_loan: any = [];
    for (var i in loan_detail.bank_loan) {
      let find_bank = _.find(get_bank, (n) => {
        if (n.bank_code === loan_detail.bank_loan[i].bank_code) {
          return true;
        }
      });

      bank_loan.push({
        ...loan_detail.bank_loan[i],
        bank_logo:
          find_bank?.bank_logo != "" && find_bank?.bank_logo != null
            ? process.env.URL + find_bank.bank_logo
            : process.env.URL + "/images/noimage.jpg",
      });
    }

    const get_developer = await Master_Developer.findOne(createRequest(), {
      developer_code: loan_detail.developer_id,
    });

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        booking_no: loan_detail.booking_no,
        contract_no: loan_detail.contract_no,
        developer_id: loan_detail.developer_id,
        developer_name: loan_detail.developer_name,
        project_id: loan_detail.project_id,
        project_name: loan_detail.project_name,
        unit_id: loan_detail.unit_id,
        unit_no: loan_detail.unit_no,
        developer_image_url: get_developer?.developer_image_url || "",
        bank_loan: bank_loan,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/loan-status/detail",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

//รายละเอียดรายการขอสินเชื่อสถานะ bank
export const loanStatusBankDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { document_no } = req.body;

    let data_body: any = {
      document_no: document_no,
    };
    const get_loan_bank_detail = await loan.loanBankDetail(data_body);

    if (get_loan_bank_detail.status != 200) {
      throw get_loan_bank_detail;
    }

    let loan_bank_detail = get_loan_bank_detail.data[0];
    const get_developer = await Master_Developer.findOne(createRequest(), {
      developer_code: loan_bank_detail.developer_id,
    });

    const find_bank = await Master_Bank.findOne(createRequest(), {
      bank_code: loan_bank_detail.bank_code,
    });

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        ...loan_bank_detail,
        developer_image_url: get_developer?.developer_image_url || "",
        bank_logo:
          find_bank.bank_logo != "" && find_bank.bank_logo != null
            ? process.env.URL + find_bank.bank_logo
            : process.env.URL + "/images/noimage.jpg",
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/loan-status/bank/detail",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

//list ธนาคารสำหรับเลือกธนาคาร (เฉพาะ ธนาคารที่อนุมัติ)
export const loanStatusSelectBanklist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { unit_id, unit_no, booking_no } = req.body;
    const customer_data = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });
    if (!customer_data) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูล",
      });
    }

    let data_body: any = {
      citizen_id: customer_data.citizen_id,
      unit_id: unit_id,
      unit_no: unit_no,
      booking_no: booking_no,
    };
    const loan_detail = await loan.loanDetail(data_body);

    if (loan_detail.status != 200) {
      throw loan_detail;
    }
    let bank_loan_list: any = [];
    let bank_loan = _.filter(
      loan_detail?.data[0]?.bank_loan,
      (n) => n.status === "approve-2"
    );

    const get_bank = await Master_Bank.find(createRequest(), {
      //status: "active",
    });

    for (var i in bank_loan) {
      let find_bank = _.find(get_bank, (n) => {
        if (n.bank_code === bank_loan[i].bank_code) {
          return true;
        }
      });

      bank_loan_list.push({
        ...bank_loan[i],
        bank_logo:
          find_bank.bank_logo != "" && find_bank.bank_logo != null
            ? process.env.URL + find_bank.bank_logo
            : process.env.URL + "/images/noimage.jpg",
      });
    }

    res.status(200).send({
      status: 200,
      message: "success",
      data: bank_loan_list,
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/loan-status/select-bank/list",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

//select bank
export const loanStatusSelectBank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { document_no } = req.body;
    let data_body: any = {
      document_no: document_no,
    };
    const loan_select_bank = await loan.loanBankSelect(data_body);

    if (loan_select_bank.status != 200) {
      throw loan_select_bank;
    }

    res.status(200).send({
      status: 200,
      message: "success",
      data: loan_select_bank.data,
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/loan-status/select-bank",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

//cancel bank
export const loanStatusUnselectBank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { document_no } = req.body;
    let data_body: any = {
      document_no: document_no,
    };
    const loan_cancel_bank = await loan.loanUnselectBank(data_body);

    if (loan_cancel_bank.status != 200) {
      throw loan_cancel_bank;
    }

    res.status(200).send({
      status: 200,
      message: "success",
      data: loan_cancel_bank.data,
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/loan/loan-status/unselect-bank",
      body: JSON.stringify(req.body),
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

//get ข้อมูลทั่วไป
async function getloanDetail(loan_id: string, customer_id: string) {
  const loan_detail = await createRequest()
    .input("loan_id", sql.NVarChar, loan_id)
    .input("customer_id", sql.NVarChar, customer_id).query(`
  SELECT TOP(1) t1.LoanId, t1.BookingNo, t1.ContractId,(case when ISNULL(t1.ContractNo,'') != '' then t1.ContractNo else '-' end) as ContractNo,
  t4.DeveloperName, t5.DeveloperImageUrl,t3.ProjectName, t3.UnitNo, t3.ModelName, t1.TotalCollateralPrice, FORMAT (t1.CreateDate, 'MM/dd/yyyy') as CreateDate
  FROM Master_Loan t1 
    INNER JOIN Mapping_Loan t2 ON t1.LoanId = t2.LoanId
    INNER JOIN Master_Unit t3 ON t1.UnitId = t3.UnitId
    INNER JOIN Master_Project t4 ON t3.ProjectCode = t4.ProjectCode
    INNER JOIN Master_Developer t5 ON t4.DeveloperCode = t5.DeveloperCode
  WHERE t1.LoanId = @loan_id AND t2.CustomerId = @customer_id

  SELECT t2.CustomerId, JSON_VALUE(t2.CustomerData, '$.customer.first_name') as FirstName, JSON_VALUE(t2.CustomerData, '$.customer.last_name') as LastName, t2.RelationWithBorrower, t2.TypeOfBorrower
  FROM Master_Loan t1 
    INNER JOIN Mapping_Loan t2 ON t1.LoanId = t2.LoanId AND t2.TypeOfBorrower = 'Co-Borrower'
  WHERE t1.LoanId = @loan_id

  SELECT t2.CustomerId, JSON_VALUE(t2.CustomerData, '$.customer.first_name') as FirstName, JSON_VALUE(t2.CustomerData, '$.customer.last_name') as LastName, JSON_VALUE(t2.CustomerData, '$.customer.date_of_birth') as DateOfBirth, t2.TypeOfBorrower
  FROM Master_Loan t1 
    INNER JOIN Mapping_Loan t2 ON t1.LoanId = t2.LoanId AND t2.TypeOfBorrower = 'Borrower'
  WHERE t1.LoanId = @loan_id
`);
  return loan_detail;
}

//get ข้อมูลผู้กู้
async function getCustomerDetail(loan_id: string, customer_id: string) {
  const customer_detail: any = await createRequest()
    .input("customer_id", sql.NVarChar, customer_id)
    .input("loan_id", sql.NVarChar, loan_id).query(`
      SELECT CustomerData 
      FROM  Mapping_Loan 
      WHERE CustomerId = @customer_id AND LoanId = @loan_id
      `);

  let customer_data = snakeCaseKeys(customer_detail.recordset[0]);
  let loan_customer: any;
  if (customer_data) {
    loan_customer = JSON.parse(customer_data.customer_data);
  }

  return loan_customer;
}

//get ที่อยู่
async function getCustomerAddress(loan_id: string, customer_id: string) {
  const get_map_loan = await Mapping_Loan.findOne(createRequest(), {
    loan_id: loan_id,
    customer_id: customer_id,
  });

  const address = snakeCaseKeys(JSON.parse(get_map_loan.customer_address));
  let customer_address = _.map(address, (n) => {
    let {
      address,
      floor,
      soi,
      moo,
      village,
      road,
      sub_district,
      sub_district_name,
      district,
      district_name,
      province,
      province_name,
      zipcode,
      address_type,
      address_type_name,
    } = n;
    return {
      address: address,
      floor: floor,
      soi: soi,
      moo: moo,
      village: village,
      road: road,
      sub_district_id: sub_district,
      sub_district_name: sub_district_name,
      district_id: district,
      district_name: district_name,
      province_id: province,
      province_name: province_name,
      post_code: zipcode,
      address_type: address_type,
      address_type_name: address_type_name,
    };
  });

  return customer_address;
}

//get ข้อมูลการขอสินเชื่อ (เอกสารหลัก)
async function getCustomerLoanDetail(loan_id: string, customer_id: string) {
  const customer_loan_detail = await Master_Customer_Loan.findOne(
    createRequest(),
    {
      loan_id: loan_id,
      customer_id: customer_id,
    }
  );
  let welfare_bank_type: any = [];

  if (!!customer_loan_detail?.welfare_bank_type) {
    welfare_bank_type = JSON.parse(customer_loan_detail?.welfare_bank_type);
  }
  return {
    id: customer_loan_detail?.id || "",
    number_of_house: customer_loan_detail?.number_of_house || "",
    number_of_debt_house: customer_loan_detail?.number_of_debt_house || "",
    company_business_type_id:
      customer_loan_detail?.company_business_type_id || "",
    company_business_type_name:
      customer_loan_detail?.company_business_type_name || "",
    grade_bureau_id: customer_loan_detail?.grade_bureau_id || "",
    grade_bureau_name: customer_loan_detail?.grade_bureau_name || "",
    welfare_id: customer_loan_detail?.welfare_id || "",
    welfare_name: customer_loan_detail?.welfare_name || "",
    welfare_bank_type: welfare_bank_type,
  };
}

//get ข้อมูลรายได้
async function getCustomerIncome(loan_id: string, customer_id: string) {
  const customer_loan_income = await Master_Customer_Loan.findOne(
    createRequest(),
    {
      loan_id: loan_id,
      customer_id: customer_id,
    }
  );

  return {
    id: customer_loan_income?.id || 0,
    income: customer_loan_income.income,
    ot: customer_loan_income.ot,
    commission: customer_loan_income.commission,
    bonus: customer_loan_income.bonus,
    service_charge: customer_loan_income.service_charge,
    perdiem: customer_loan_income.perdiem,
    income_other_fix: customer_loan_income.income_other_fix,
    income_other_not_fix: customer_loan_income.income_other_not_fix,
    income_extra: customer_loan_income.income_extra,
    income_rental: customer_loan_income.income_rental,
    total_income: customer_loan_income.total_income,
  };
}

//get ข้อมูลรายจ่าย
async function getCustomerPay(loan_id: string, customer_id: string) {
  const customer_loan_pay = await Master_Customer_Loan.findOne(
    createRequest(),
    {
      loan_id: loan_id,
      customer_id: customer_id,
    }
  );

  return {
    id: customer_loan_pay?.id || 0,
    pay_social_insurance: customer_loan_pay.pay_social_insurance,
    pay_slip_tax: customer_loan_pay.pay_slip_tax,
    pay_slip_cooperative: customer_loan_pay.pay_slip_cooperative,
    pay_slip_other: customer_loan_pay.pay_slip_other,
    pay_providentfund: customer_loan_pay.pay_providentfund,
    pay_home_loan: customer_loan_pay.pay_home_loan,
    pay_car_loan: customer_loan_pay.pay_car_loan,
    debt_total_credit_card: customer_loan_pay?.debt_total_credit_card,
    debt_credit_card_per_month: customer_loan_pay.debt_credit_card_per_month,
    debt_cash_card: customer_loan_pay?.debt_cash_card,
    debt_other: customer_loan_pay?.debt_other,
    total_debt: customer_loan_pay?.total_debt,
  };
}

//get list เอกสารแนบ
async function getDocList(loan_id: string, customer_id: string) {
  const get_document_list = await createRequest()
    .input("customer_id", sql.NVarChar, customer_id)
    .input("loan_id", sql.NVarChar, loan_id).query(`
    SELECT t1.Id, t1.FileName, t1.FileSize, t1.FileType , t1.FileExtension, t1.GroupType, t1.RefType, t2.DeveloperCode
    FROM Master_File t1 
    INNER JOIN Master_Loan t2 ON t1.RefId = t2.LoanId 
    WHERE t1.RefId = @loan_id AND t1.CustomerId = @customer_id AND (t1.GroupType IN('2','4','5','6'))
    `);

  let document_list_data = snakeCaseKeys(get_document_list.recordset);
  for (var i in document_list_data) {
    let file_id = await encryptionFileIdentifier(
      String(document_list_data[i].id)
    );
    document_list_data[i].id = file_id;
  }
  let document_list = _.map(document_list_data, (n) => new fileResponse(n));

  return document_list;
}

//get ข้อมูลธนาคารที่ยื่นกู้
async function getIsSelectBank(loan_id: string, customer_id: string) {
  const get_bank = await createRequest()
    .input("customer_id", sql.NVarChar, customer_id)
    .input("loan_id", sql.NVarChar, loan_id).query(`
SELECT t2.BankCode , t2.Name as BankName, t2.BankLogo , t1.IsSelectBank
FROM Mapping_Loan_Bank t1 
INNER JOIN Master_bank t2 ON t1.BankCode = t2.BankCode
WHERE t1.LoanId = @loan_id AND CustomerId = @customer_id AND t1.IsSelectBank = 1
`);

  let marter_bank = await _.map(snakeCaseKeys(get_bank.recordset), (n: any) => {
    let { bank_code, bank_name, bank_logo, is_select_bank } = n;
    return {
      bank_code: bank_code,
      bank_name: bank_name,
      bank_logo:
        bank_logo != "" && bank_logo != null
          ? process.env.URL + bank_logo
          : process.env.URL + "/images/noimage.jpg",
      is_select_bank: is_select_bank,
    };
  });

  return marter_bank || [];
}
