import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import {
  Transaction_Inquiry,
  Log_Api,
  Master_File,
  Master_Subject_Inquiry,
  Master_Customer,
} from "../../dbclass";
import sql from "mssql";
import _ from "lodash";
import { fileResponse } from "../../models/FileResponse";
import * as validation from "../validation";
import {
  encryptionFileIdentifier,
  decryptionFileIdentifier,
} from "../../middlewares/file-authorization";
import { sendMail } from "../../services/email.service";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import axios from "axios";

export const inquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inquiry_list = await Transaction_Inquiry.find(createRequest(), {
      customer_id: req.customer_id,
    });

    let result = _.map(inquiry_list, (n) => {
      let { id, subject_name, detail, create_date } = n;

      return {
        id: id,
        subject_name: subject_name,
        detail: detail,
        date: create_date,
      };
    });

    res.status(200).send({ status: 200, message: "success", data: result });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/inquiry",
      body: "",
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const inquiryDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inquiry = await Transaction_Inquiry.findOne(createRequest(), {
      id: req.body.id,
      customer_id: req.customer_id,
    });
    let result = {};
    if (inquiry) {
      const file_document: any = await Master_File.find(createRequest(), {
        ref_id: String(inquiry.id),
        group_type: "inquiry",
        customer_id: req.customer_id,
        status: "active",
      });

      for (var i in file_document) {
        let file_id = await encryptionFileIdentifier(
          String(file_document[i].id)
        );
        file_document[i].id = file_id;
      }
      let document_list = _.map(file_document, (n) => new fileResponse(n));

      result = {
        id: inquiry.id,
        subject_id: inquiry?.subject_id || 0,
        subject_name: inquiry?.subject_name || "",
        detail: inquiry?.detail || "",
        date: inquiry?.create_date || "",
        file_document: document_list[0] || {},
      };
    }
    res.status(200).send({
      status: 200,
      message: "success",
      data: result,
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/inquiry/detail",
      body: "",
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const createInquiry = async (
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
        ["subject_id", "detail", "date", "file_document"],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.inquirySchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { subject_id, detail, date, file_document } = req.body;

    const subject = await Master_Subject_Inquiry.findOne(createRequest(), {
      id: subject_id,
    });

    const inquiry = await Transaction_Inquiry.insert(createRequest(trans), {
      customer_id: req.customer_id,
      subject_id: String(subject_id),
      subject_name: subject?.subject || "",
      detail: detail,
      create_date: date,
    });

    let file_id = await decryptionFileIdentifier(String(file_document.id));
    // document
    await Master_File.update(
      createRequest(),
      {
        ref_id: String(inquiry),
        status: "active",
      },
      {
        id: parseInt(file_id),
        customer_id: req.customer_id,
      }
    );

    const get_customer = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });

    if (get_customer) {
      let file_document: any = [];
      const get_file = await Master_File.findOne(createRequest(), {
        id: parseInt(file_id),
        customer_id: req.customer_id,
        ref_id: String(inquiry),
      });
      if (get_file) {
        const account_name = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
        if (!account_name) throw Error("Azure Storage accountName not found");
        const account_key = process.env.AZURE_STORAGE_KEY || "";

        const shared_key_credential = new StorageSharedKeyCredential(
          account_name,
          account_key
        );
        const blob_service_client = new BlobServiceClient(
          `https://${account_name}.blob.core.windows.net`,
          shared_key_credential
        );
        
        const ret = await axios.get(blob_service_client.url + get_file.file_path as string, {
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(ret.data as string, "binary");

        file_document = [
          {
            filename: get_file?.file_name || subject?.subject || "",
            content: buffer,
          },
        ];
      }
      let data: any = {
        send_to: process.env.INQUIRY_SUPPORT_EMAIL,
        subject: `ICON Digital Gateway : แจ้งเรื่องร้องเรียน : ${subject?.subject}`,
        type: "email_inquiry",
        subject_name: subject?.subject,
        detail: detail,
        customer_name: `${get_customer?.first_name} ${get_customer?.last_name}`,
        mobile_number:
          get_customer?.mobile_number || get_customer?.phone_number || "",
        email: get_customer?.email || "",
        file_document: file_document,
      };

      let send_mail = await sendMail(data);
      if (!send_mail) {
        return res.status(400).send({
          status: 400,
          message: "แจ้งปัญหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        });
      }
    }

    await trans.commit();
    res.status(200).send({ status: 200, message: "แจ้งปัญหาสำเร็จ" });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/inquiry/create",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};
