import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import { Transaction_Email_Otp, Log_Api, Master_Customer } from "../../dbclass";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import randomstring from "randomstring";
import { sendMail } from "../../services/email.service";
import * as validation from "../validation";
import sql from "mssql";
import { snakeCaseKeys } from "../../utility";
import { requestPinSchema } from "../validation";

export const requestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (!validation.compareKeys(["line_id", "email"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.emailSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { email, line_id } = req.body;
    //requse otp
    const token = uuidv4();
    const ref: string = randomstring.generate({
      length: 4,
      charset: "alphabetic",
    });
    let otp_number: string = randomstring.generate({
      length: 6,
      charset: "numeric",
    });
    let pin_code: string = ref + "-" + otp_number;

    await Transaction_Email_Otp.update(
      createRequest(),
      {
        status: "deactive",
        expied_date: new Date(),
      },
      {
        line_id: line_id,
        email: email,
        status: "pending",
      }
    );

    await Transaction_Email_Otp.insert(createRequest(), {
      line_id: line_id,
      email: email,
      pin_code: pin_code,
      token: token,
      status: "pending",
    });
    const data = {
      send_to: email,
      subject: "ICON Digital Gateway: รหัส(OTP) สำหรับยืนยันตัวตน",
      type: "email_otp",
      pin_code: otp_number,
      ref_code: ref,
    };

    //ส่ง email ยืนยันตัวตน
    let send_mail = await sendMail(data);

    if (send_mail) {
      res.status(200).send({
        status: 200,
        message: "ส่งรหัส OTP ไปยังอีเมลสำเร็จ",
        data: {
          token: token,
          ref: ref,
        },
      });
    } else {
      res.status(500).send({
        status: 500,
        message: "ส่งรหัส OTP ไปยังอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      });
    }
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/email/request-otp",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
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
      return res
        .status(400)
        .send({ status: 400, message: "Body can not be empty!" });
    }

    let pin_code: string = ref + "-" + otp_number;
    const email_otp = await Transaction_Email_Otp.findOne(createRequest(), {
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
        await Transaction_Email_Otp.update(
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
        res.status(205).send({ status: 205, message: "รหัส OTP หมดอายุ" });
      }
    } else {
      res.status(202).send({ status: 202, message: "รหัส OTP ไม่ถูกต้อง" });
    }
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/email/verify-otp",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};

export const requestPin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { line_id, last_citizen_id } = req.body;

    await requestPinSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    //1. หาข้อมูลลูกค้าจาก line id
    const get_customer = await createRequest().input(
      "line_id",
      sql.NVarChar,
      line_id
    ).query(`
      SELECT TOP 1 t1.Email, t1.FirstName, t1.LastName, t1.CitizenId
      FROM Master_Customer t1 
        INNER JOIN Mapping_Customer_Register t2 ON t1.CustomerId = t2.CustomerId
      WHERE t2.LineId = @line_id AND t2.Status = 'active'
    `);

    let customer_data: any = snakeCaseKeys(get_customer.recordset[0]);
    if (!customer_data) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลผู้ใช้งานของท่าน",
      });
    }

    if(!customer_data.citizen_id || customer_data.citizen_id.slice(-4) != last_citizen_id){
      return res.status(400).send({
        status: 400,
        message: "ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
      });
    }
    
    //ส่ง email เพื่อขอ pin สำหรับลืมรหัสผ่าน
    const token = uuidv4();
    let pin_code: string = randomstring.generate({
      length: 6,
      charset: "numeric",
    });
    let expied_date = new Date(moment().add(30, "minutes").toString());

    await Transaction_Email_Otp.update(
      createRequest(),
      {
        status: "deactive",
        expied_date: new Date(),
      },
      {
        line_id: line_id,
        email: customer_data.email,
        status: "pending",
      }
    );

    await Transaction_Email_Otp.insert(createRequest(), {
      line_id: line_id,
      email: customer_data.email,
      pin_code: pin_code,
      token: token,
      expied_date: expied_date,
      status: "pending",
    });

    const data = {
      send_to: customer_data.email,
      subject: "ICON Digital Gateway: PIN สำหรับตั้งรหัสผ่านใหม่",
      type: "email_request_pin",
      pin_code: pin_code
    };

    //ส่ง email เพื่อส่ง PIN สำหรับตั้งรหัสผ่านใหม่
    let send_mail = await sendMail(data);

    if (send_mail) {
      res.status(200).send({
        status: 200,
        message: "ส่งรหัส PIN ไปยังอีเมลสำเร็จ",
        data: {
          token: token,
        },
      });
    } else {
      res.status(500).send({
        status: 500,
        message: "ส่งรหัส PIN ไปยังอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      });
    }
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/email/request-pin",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(error.status || 500).send({
      status: error.status || 500,
      message: error.message,
    });
  }
};

export const verifyPin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, pin } = req.body;
    // Validate request
    if (!req.body) {
      return res
        .status(400)
        .send({ status: 400, message: "Body can not be empty!" });
    }

    let pin_code: string = pin;
    const email_otp = await Transaction_Email_Otp.findOne(createRequest(), {
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
        await Transaction_Email_Otp.update(
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

        res.status(200).send({ status: 200, message: "ยืนยัน PIN สำเร็จ" });
      } else {
        res.status(205).send({
          status: 205,
          message: "ขออภัย รหัสหมดอายุ กรุณากดลืมรหัสผ่านเพื่อขอรหัสใหม่",
        });
      }
    } else {
      res
        .status(202)
        .send({
          status: 202,
          message: "ท่านระบุรหัสไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านจากอีเมลของท่าน",
        });
    }
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/email/verify-pin",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};
