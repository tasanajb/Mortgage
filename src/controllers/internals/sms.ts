import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import { Log_Api, Log_Sms, Transaction_Sms_Otp } from "../../dbclass";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import randomstring from "randomstring";
import { sendSms} from "../../services/sms.service";
import * as validation from "../validation";

export const requestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (!validation.compareKeys(["line_id", "mobile_number", "citizen_id"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.mobileSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { mobile_number, line_id, citizen_id } = req.body;

    const mobile = "+66" + mobile_number.replace("-", "").substring(1);
    //requse sms
    const token = uuidv4();
    const ref: string = randomstring.generate({
      length: 4,
      charset: "alphabetic",
    });
    //let pin_number : number =  Math.floor(100000 + Math.random() * 900000);
    let otp_number: string = randomstring.generate({
      length: 6,
      charset: "numeric",
    });
    let pin_code: string = `${otp_number} (${ref})`;

    // ส่ง sms otp
    let sms: any = await sendSms(pin_code, mobile);
    if (sms.status === 200) {
      await Transaction_Sms_Otp.update(createRequest(),{
        status: "deactive",
        expied_date: new Date()
      },{
        line_id: line_id,
        mobile_number: mobile,
        status: "pending"
      })

      await Transaction_Sms_Otp.insert(createRequest(), {
        line_id: line_id,
        citizen_id: citizen_id,
        mobile_number: mobile,
        pin_code: pin_code,
        token: String(sms.message.result.transaction_id),
        status: "pending",
        //expied_date: new Date(moment().add(5, "minutes").toString()), database auto insert
      });

      res.status(200).send({
        status: 200,
        message: "ส่งรหัส OTP สำเร็จ",
        data: {
          token: String(sms.message.result.transaction_id),
          ref: ref,
        },
      });
    } else {
      await Log_Sms.insert(createRequest(), {
        type: "sms otp",
        body: JSON.stringify({ pin_code, mobile }),
        error_message: sms.message,
      });

      res.status(500).send({
        status: 500,
        message: "ส่งรหัส OTP ไม่สำเร็จ",
      });
    }
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/sms/request-otp",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, ref, otp_number } = req.body;
    // Validate request
    if (!req.body) {
      return res.status(400).send({
        message: "Body can not be empty!",
      });
    }

    let pin_code: string = `${otp_number} (${ref})`;
    const email_otp = await Transaction_Sms_Otp.findOne(createRequest(), {
      token: token,
      pin_code: pin_code,
      status: "pending",
    });

    if (email_otp) {
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      const expired = moment(email_otp.expied_date).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      if (moment(now).unix() <= moment(expired).unix()) {
        await Transaction_Sms_Otp.update(
          createRequest(),
          {
            status: "success",
            update_date: new Date(),
          },
          {
            token: token,
            status: "pending",
          }
        );

        res.status(200).send({ status: 200, message: "ยืนยัน OTP สำเร็จ" });
      } else {
        res.status(202).send({ status: 205, message: "รหัส OTP หมดอายุ" });
      }
    } else {
      res.status(202).send({ status: 202, message: "รหัส OTP ไม่ถูกต้อง" });
    }
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/sms/verify-otp",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};
