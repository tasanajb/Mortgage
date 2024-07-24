import { NextFunction, Request, Response } from "express";
import { createRequest } from "../config";
import {
  Mapping_Customer_Register,
  Master_Customer,
} from "../dbclass";
import _ from "lodash";
import bcrypt from "bcrypt";
import moment from "moment";

export const checkPin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res
        .status(400)
        .send({ status: 400, message: "ขออภัยไม่สามารถทำรายการได้ กรุณาใส่รหัสผ่าน" });
    }

    const customer = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: req.line_id,
      status: "active",
    });

    if (!customer) {
      return res
        .status(400)
        .send({ status: 400, message: "ไม่พบข้อมูลผู้ใช้งานของท่าน" });
    }

    const check_blocked_pin = await checkDateBlockedPin(
      customer.count_wrong_pin,
      customer.expied_date_blocked_pin,
      customer.blocked_minutes
    );

    if (check_blocked_pin.status !== 200) {
      return res.status(check_blocked_pin.status).send({
        status: check_blocked_pin.status,
        message: check_blocked_pin.message,
        data: check_blocked_pin.data,
      });
    }

    if (customer && bcrypt.compareSync(pin, customer.pin)) {
      next();
    }else{
        let count_pin: number = 0;

      const check_pin = await checkWrongPin(
        count_pin,
        customer.count_wrong_pin,
        customer.expied_date_blocked_pin,
        customer.blocked_minutes,
        req.line_id
      );
      return res.status(401).send({
        status: 401,
        message: check_pin.message,
        data: {
          count_wrong_pin: check_pin.count_wrong_pin,
          blocked_minutes: check_pin.blocked_minutes,
          expied_date_blocked_pin: check_pin.expied_date_blocked_pin,
          blocked_pin: check_pin.blocked_pin,
        },
      });
    }
  } catch (error) {
    res.status(401).send({status: 401, message: error.message});
  }
};


async function checkWrongPin(
  count_pin: number,
  count_wrong_pin: number,
  expired: any,
  minutes: number,
  line_id: string
) {
  count_pin = count_wrong_pin + 1;
  let message: string;
  let blocked_minutes: number = minutes || 0;
  let blocked_pin = false;
  let expied_date: any;

  if (count_pin < 3) {
    message = "ท่านระบุรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง (ท่านสามารถระบุรหัสผ่านได้ 3 ครั้ง)";
    expied_date = expired || new Date();
  }

  if (count_pin >= 3) {
    blocked_pin = true;
    blocked_minutes = blocked_minutes + 30;
    expied_date = new Date(moment().add(blocked_minutes, "minutes").toString());
    message =
      "ขออภัย ท่านใส่รหัสผ่านผิดเกินกำหนด กรุณารอ " +
      blocked_minutes +
      "นาที หรือกดลืมรหัสผ่าน";
  }

  await Mapping_Customer_Register.update(
    createRequest(),
    {
      count_wrong_pin: count_pin,
      expied_date_blocked_pin: expied_date,
      blocked_minutes: blocked_minutes,
    },
    {
      line_id: line_id,
      status: "active",
    }
  );
  return {
    message: message,
    count_wrong_pin: count_pin,
    expied_date_blocked_pin: moment(expied_date).format("YYYY-MM-DD HH:mm:ss"),
    blocked_minutes: blocked_minutes,
    blocked_pin: blocked_pin,
  };
}

async function checkDateBlockedPin(
  count_wrong_pin: number,
  expied_date_blocked_pin: any,
  blocked_minutes: number
) {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  const expired = moment(expied_date_blocked_pin || now).format(
    "YYYY-MM-DD HH:mm:ss"
  );

  let result: any = {
    status: 200,
    message: "PIN ไม่ถูกระงับการใช้งาน",
    data: {
      count_wrong_pin: count_wrong_pin,
      blocked_minutes: blocked_minutes,
      expied_date_blocked_pin: expired,
      blocked_pin: false,
    },
  };

  if (count_wrong_pin >= 3 && moment(now).unix() < moment(expired).unix()) {
    result = {
      status: 401,
      message: "ขออภัย PIN ถูกระงับการใช้งาน",
      data: {
        count_wrong_pin: count_wrong_pin,
        blocked_minutes: blocked_minutes,
        expied_date_blocked_pin: expired,
        blocked_pin: true,
      },
    };
  }
  return result;
}
