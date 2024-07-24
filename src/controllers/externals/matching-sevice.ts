import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import { Log_Api, Master_Customer, Master_Developer } from "../../dbclass";
import formdata from "form-data";
import fs from "fs";
import crypto from "crypto";
import { snakeCaseKeys } from "../../../src/utility";
import _ from "lodash";

export const ncbReportApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const check_ncb_report = await checkNcbReport(req.body);
    console.log("check_ncb_report:", check_ncb_report);
    if (check_ncb_report.status != 200) {
      return res.status(check_ncb_report.status).send({
        status: check_ncb_report.status,
        message: check_ncb_report.data.message,
      });
    }

    res.status(200).send({
      status: 200,
      message: "success",
      data: check_ncb_report.data,
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/matching-service/ncb/repot",
      body: JSON.stringify(req.body),
      error_message: JSON.stringify(error?.message || ""),
    });
    res.status(500).send({ status: 500, message: error?.message || error });
  }
};

export const ncbReport = async (data_body: any) => {
  try {
    const get_customer = await Master_Customer.findOne(createRequest(), {
      customer_id: data_body.customer_id,
    });

    if (!get_customer || get_customer.citizen_id === "") {
      return {
        status: 400,
        message: "ไม่พบข้อมูลลูกค้า",
      };
    }

    data_body.citizen_id = get_customer.citizen_id;
    const check_ncb_report = await checkNcbReport(data_body);
    if (check_ncb_report.status != 200) {
      console.log("Check Ncb Report ===>", check_ncb_report);
      return {
        status: check_ncb_report.status,
        message: check_ncb_report?.message,
      };
    }

    return {
      status: 200,
      message: check_ncb_report?.message || "success",
      data: check_ncb_report.data,
    };
  } catch (error) {
    console.log("Error: Check Ncb Report ===>", error);
    return { status: 500, message: error?.message || error };
  }
};

export const bankMatching = async (data_body: any) => {
  try {
    //get Bank List From Developer
    const list_bank_rem: any = await getListBankRem(data_body.developer_code);

    if (list_bank_rem.status != 200) {
      return {
        status: list_bank_rem.status,
        message: list_bank_rem.message,
      };
    }

    let bank =  _.map(list_bank_rem.data.bank, (n) => {
      let { bank_id } = n;
      return bank_id;
    });

    data_body.bank = bank || [];
    const bank_matching = (await axios({
      method: "POST",
      url: `${process.env.SERVICE_MATCHING_API_URL}/bank-matching`,
      data: data_body,
    })) as any;

    if (bank_matching.status != 200) {
      return {
        status: bank_matching.status,
        message: bank_matching.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      data: bank_matching.data,
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.SERVICE_MATCHING_API_URL}/bank-matching`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.message),
    });
    return { status: 500, message: "ขออภัย เกิดข้อผิดพลาดกรุณาลองใหม่อีกครั้ง" };
  }
};

async function checkNcbReport(data_body: any) {
  try {
    // เข้ารหัส password
    const algorithm = "aes-256-cbc";
    const plubic_key = process.env.SERVICE_MATCHING_PLUBIC_KEY;
    const secret_key = process.env.SERVICE_MATCHING_SECRET_KEY;
    const cipher = crypto.createCipheriv(algorithm, secret_key, plubic_key);
    let encrypted_password = cipher.update(data_body.password, "utf-8", "hex");
    encrypted_password += cipher.final("hex");

    const ncb_report = (await axios({
      method: "POST",
      url: `${process.env.SERVICE_MATCHING_API_URL}/ncb/report`,
      data: {
        files: [{ ...data_body.file }],
        password: encrypted_password,
        plubic_key: plubic_key,
        loan_id: data_body.loan_id,
        user_id: data_body.citizen_id,
        developer_code: data_body.developer_code,
      },
    })) as any;

    return ncb_report;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.SERVICE_MATCHING_API_URL}/ncb/report`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data?.message || error?.message),
    });

    return { status: error?.status || 500, message: error?.response?.data?.message || error?.message || "ขออภัย เกิดข้อผิดพลาดกรุณาลองใหม่อีกครั้ง" };
  }
}

async function getListBankRem(developer_code: string) {
  try {
    const developer = await Master_Developer.findOne(createRequest(), {
      developer_code: developer_code,
    });

    if (!developer) {
      return { status: 400, message: "ไม่พบข้อมูลบริษัท" };
    }

    let headers: any = JSON.parse(developer.header_api);
    let url_api = developer.url_api;

    const rem_list_bank = (await axios({
      method: "POST",
      url: `${url_api}/loan/loadListBankOpen`,
      headers: headers,
    })) as any;

    if (rem_list_bank.data.statusCode != 200) {
      return {
        status: rem_list_bank.data.statusCode,
        message: rem_list_bank.data.statusDesc,
      };
    }

    return {
      status: 200,
      message: "success",
      data: snakeCaseKeys(rem_list_bank.data.data),
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `/loan/loadListBankOpen`,
      body: JSON.stringify(developer_code),
      error_message: JSON.stringify(error?.message),
    });

    return { status: error?.status || 500, message: error.message };
  }
}
