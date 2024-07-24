import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import sql from "mssql";
import {
  Master_Customer,
  Mapping_Customer_Register,
  Log_Api,
  Transaction_Customer_Login,
  Transaction_Sms_Otp,
  Transaction_Email_Otp,
} from "../../dbclass";
import bcrypt from "bcrypt";
import jwt from "../../utility/jwt";
import * as validation from "../validation";
import * as lineService from "../../services/line.sevice";
import * as massage from "../message-line";
import moment from "moment";
import { verifyIdCard } from "../externals/dopa";
import { snakeCaseKeys } from "../../utility";

export const consent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (!validation.compareKeys(["line_id", "is_accept"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.consentSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { line_id, is_accept } = req.body;
    const register = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: line_id,
    });

    let line_profile = await lineService.getUserLineProfile(req.body.line_id);

    if (!register) {
      await Mapping_Customer_Register.insert(createRequest(), {
        line_id: line_id,
        line_name: line_profile?.displayName || "",
        is_accept: is_accept,
      });
    } else {
      await Mapping_Customer_Register.update(
        createRequest(),
        {
          line_name: line_profile?.displayName || "",
          is_accept: is_accept,
          update_date: new Date(),
        },
        {
          line_id: line_id,
        }
      );
    }

    res.status(200).send({ status: 200, message: "success" });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/consent",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};

export const checkCitizenId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (
      !validation.compareKeys(
        [
          "citizen_id",
          "laser_code",
          "first_name",
          "last_name",
          "date_of_birth",
        ],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.checkCitizenSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { citizen_id, laser_code, first_name, last_name, date_of_birth } =
      req.body;
    //เช็คอายุ
    let check_age = moment().diff(date_of_birth, "years", false);
    if (check_age < 20) {
      return res.status(400).send({
        status: 400,
        message:
          "ขออภัยท่านไม่สามารถลงทะเบียนเข้าใช้งานระบบได้ เนื่องจากอายุของท่านยังไม่ถึงเกณฑ์ที่กำหนด",
      });
    }

    const get_citizen_register: any = await createRequest().input(
      "citizen_id",
      sql.NVarChar,
      citizen_id
    ).query(`
      SELECT t1.CitizenId
      FROM Master_Customer t1
      INNER JOIN Mapping_Customer_Register t2 ON t1.CustomerId = t2.CustomerId
      WHERE t2.Status = 'active' AND t1.CitizenId =  @citizen_id
      `);

    let check_register = get_citizen_register.recordset[0];

    if (check_register) {
      return res.status(400).send({
        status: 400,
        message:
          "ไม่สามารถลงทะเบียนเข้าใช้งานได้เนื่องจากหมายเลขบัตรประชาชนนี้มีผู้ลงทะเบียนไปแล้ว กรุณาติดต่อผู้ให้บริการ",
      });
    }

    //เชื่อมต่อ api สำหรับตรวจสอบบัตรประชาชน
    let data_body: any = {
      cid: citizen_id,
      laser_code: laser_code, //เลขหลังบัตรประชาชน  ex. "KT0123456789"
      birth_date: moment(date_of_birth).format("yyyyMMDD"), //ex. "19900219" (format: yyyyMMdd)
      first_name: first_name, //"ชือภาษาไทย"
      last_name: last_name, //"นามสกุลภาษาไทย"
    }

    const verify_id_card = await verifyIdCard(data_body);
    if (verify_id_card.status != 200) {
      //throw verify_id_card;
      return res.status(verify_id_card?.status || 400).send({
        status: verify_id_card?.status || 400,
        message: verify_id_card?.message || "หมายเลขบัตรประชาชนนี้ไม่สามารถลงทะเบียนเข้าใช้งานระบบได้",
        data: verify_id_card?.data || {}
      });
    }

    res.status(200).send({
      status: 200,
      message: "หมายเลขบัตรประชาชนนี้สามารถลงทะเบียนเข้าใช้งานระบบได้",
      //data: verify_id_card?.data || {}
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/check-citizen",
      body: JSON.stringify(req.body),
      error_message: error?.response?.data?.message || error?.message || "",
    });
    res.status(error?.response?.status || error?.status || 500).send({
      status: error?.response?.status || error?.status || 500,
      message:
        error?.response?.data?.message || error?.message || "เกิดข้อผิดพลาด",
    });
  }
};

export const register = async (
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
          "line_id",
          "citizen_id",
          "first_name",
          "last_name",
          "date_of_birth",
          "mobile_number",
          "email",
          "pin",
          "pin_confirm",
        ],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.registerSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const {
      line_id,
      citizen_id,
      first_name,
      last_name,
      date_of_birth,
      mobile_number,
      email,
      pin,
      pin_confirm,
    } = req.body;

    const check_consent = await Mapping_Customer_Register.findOne(
      createRequest(),
      {
        line_id: line_id,
      }
    );

    if (check_consent?.is_accept != true) {
      return res.status(400).send({
        status: 400,
        message:
          "ขออภัยท่านยังไม่กดยอมรับข้อตกลง กรุณากดยอมรับข้อตกลงเงื่อนไขการใช้งาน",
      });
    }

    if (pin !== pin_confirm) {
      return res.status(400).send({
        status: 400,
        message: "ท่านระบุรหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
      });
    }

    const customer = await Master_Customer.findOne(createRequest(), {
      citizen_id: citizen_id,
    });

    let mobile: string = "+66" + mobile_number.replace("-", "").substring(1);
    const checkMobile = await Transaction_Sms_Otp.findOne(createRequest(), {
      line_id: line_id,
      mobile_number: mobile,
      status: "success",
    });

    if (!checkMobile) {
      return res.status(400).send({
        status: 400,
        message: "เบอร์โทรศัพท์นี้ยังไม่ถูกยืนยันตัวตน",
      });
    }

    const checkEmail = await Transaction_Email_Otp.findOne(createRequest(), {
      line_id: line_id,
      email: email,
      status: "success",
    });

    if (!checkEmail) {
      return res.status(400).send({
        status: 400,
        message: "อีเมลนี้ยังไม่ถูกยืนยันตัวตน",
      });
    }

    let customer_id = "";
    if (!customer) {
      const customer_runnumber = await createRequest()
        .input("RunKey", sql.NVarChar, "Customer")
        .input("KeyCode", sql.NVarChar, "CUS")
        .input("CreateDate", sql.Date, new Date())
        .execute("sp_CreateRunning");

      customer_id = String(customer_runnumber.recordset[0]["RunKey"]);

      await Master_Customer.insert(createRequest(trans), {
        customer_id: String(customer_id),
        citizen_id: citizen_id,
        first_name: first_name,
        last_name: last_name,
        date_of_birth: moment(date_of_birth).format("DD/MM/YYYY"),
        mobile_number: mobile_number,
        email: email,
      });
    } else {
      customer_id = customer.customer_id;

      const check_register = await Mapping_Customer_Register.findOne(
        createRequest(),
        {
          customer_id: customer_id,
          status: "active",
        }
      );

      if (check_register) {
        return res.status(400).send({
          status: 400,
          message:
            "ไม่สามารถลงทะเบียนเข้าใช้งานได้เนื่องจากหมายเลขบัตรประชาชนนี้มีผู้ลงทะเบียนไปแล้ว กรุณาติดต่อผู้ให้บริการ",
        });
      }

      await Master_Customer.update(
        createRequest(trans),
        {
          first_name: first_name,
          last_name: last_name,
          date_of_birth: moment(date_of_birth).format("DD/MM/YYYY"),
          mobile_number: mobile_number,
          email: email,
          update_date: new Date(),
        },
        {
          customer_id: String(customer_id),
          citizen_id: citizen_id,
        }
      );
    }

    await Mapping_Customer_Register.update(
      createRequest(trans),
      {
        customer_id: String(customer_id),
        pin: bcrypt.hashSync(pin_confirm, 10),
        status: "active",
        count_wrong_pin: 0,
        update_date: new Date(),
      },
      { line_id: line_id }
    );

    let token_id = jwt.sign(
      { line_id, customer_id },
      {
        expiresIn: "2h",
        algorithm: "RS256",
      }
    );

    await Transaction_Customer_Login.delete(createRequest(trans), {
      line_id: line_id,
    });

    await Transaction_Customer_Login.insert(createRequest(trans), {
      line_id: line_id,
      token_id: token_id,
      status: "active",
    });

    //get line profile
    let line_profile = await lineService.getUserLineProfile(line_id);
    const data_noti = {
      display_name: first_name || line_profile.displayName,
      picture_url: line_profile.pictureUrl,
      line_id: line_id,
    };
    //LINE OA Link Rich Menu to a User and send message noti
    lineService.lineOaLinkMenuToUser(line_id);
    massage.registerSuccessMessage(data_noti);

    await trans.commit();
    res.status(200).send({
      status: 200,
      message: "ลงทะเบียนสำเร็จ",
      data: { token: token_id },
    });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/Register",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .send({ status: 400, message: "Body can not be empty!" });
    }

    const { line_id, pin } = req.body;

    let count_pin: number = 0;
    const customer = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: line_id,
      status: "active",
    });
    if (!customer) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลผู้ใช้งานของท่าน กรุณาลงทะเบียนเข้าใช้งาน",
      });
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
      let customer_id = customer.customer_id;

      const check_customer = await Master_Customer.findOne(createRequest(), {
        customer_id: customer_id,
      });

      if (!check_customer) {
        return res.status(400).send({
          status: 400,
          message: "ไม่พบข้อมูลผู้ใช้งานของท่าน กรุณาลงทะเบียนเข้าใช้งาน",
        });
      }

      let token_id = jwt.sign(
        { line_id, customer_id },
        {
          expiresIn: "2h",
          algorithm: "RS256",
        }
      );

      await Mapping_Customer_Register.update(
        createRequest(),
        {
          count_wrong_pin: 0,
          expied_date_blocked_pin: null,
          blocked_minutes: 0,
          update_date: new Date(),
        },
        {
          line_id: line_id,
          status: "active",
        }
      );

      await Transaction_Customer_Login.delete(createRequest(), {
        line_id: line_id,
      });

      await Transaction_Customer_Login.insert(createRequest(), {
        line_id: line_id,
        token_id: token_id,
        status: "active",
      });

      res.status(200).send({
        status: 200,
        message: "เข้าสู่ระบบสำเร็จ",
        data: { token: token_id, blocked_pin: false },
      });
    } else {
      const check_pin = await checkWrongPin(
        count_pin,
        customer.count_wrong_pin,
        customer.expied_date_blocked_pin,
        customer.blocked_minutes,
        line_id
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
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/login",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const getToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .send({ status: 400, message: "Body can not be empty!" });
    }

    const { line_id } = req.body;
    console.log(req.body);
    const customer = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: line_id,
      status: "active",
    });
    if (!customer) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลผู้ใช้งานของท่าน กรุณาลงทะเบียนเข้าใช้งาน",
      });
    }
    
    let customer_id = customer.customer_id;

    const check_customer = await Master_Customer.findOne(createRequest(), {
        customer_id: customer_id,
    });

    if (!check_customer) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลผู้ใช้งานของท่าน กรุณาลงทะเบียนเข้าใช้งาน",
      });
    }

    let token_id = jwt.sign(
      { line_id },
      {
        expiresIn: "2h",
        algorithm: "RS256",
      }
    );

    await Mapping_Customer_Register.update(
      createRequest(),
      {
        count_wrong_pin: 0,
        expied_date_blocked_pin: null,
        blocked_minutes: 0,
        update_date: new Date(),
      },
      {
        line_id: line_id,
        status: "active",
      }
    );

    await Transaction_Customer_Login.delete(createRequest(), {
      line_id: line_id,
    });

    await Transaction_Customer_Login.insert(createRequest(), {
      line_id: line_id,
      token_id: token_id,
      status: "active",
    });

    res.status(200).send({
      status: 200,
      message: "สำเร็จ",
      data: { token: token_id, blocked_pin: false },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/token",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //let trans = new sql.Transaction(pool);
  try {
    //await trans.begin();
    if (!req.body) {
      return res
        .status(400)
        .send({ status: 400, message: "Body can not be empty!" });
    }

    const { line_id, pin } = req.body;

    //1. หา customer ที่ใช้ line id นี้อยู่
    const customer = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: line_id,
      customer_id: req.customer_id,
      status: "active",
    });

    if (!customer) {
      return res
        .status(400)
        .send({ status: 400, message: "ไม่พบข้อมูลผู้ใช้งานของท่าน" });
    }

    //2. check pin และ update ข้อมูล
    if (customer && bcrypt.compareSync(pin, customer.pin)) {
      let customer_id = customer.customer_id;

      //2.1. เปลี่ยนสถานะเป็น de active ปิดการใช้งาน
      await Mapping_Customer_Register.update(
        createRequest(),
        {
          status: "deactive",
          update_date: new Date(),
        },
        {
          line_id: line_id,
          customer_id: customer_id,
        }
      );

      //2.2. ลบข้อมูล token
      await Transaction_Customer_Login.delete(createRequest(), {
        line_id: line_id,
      });

      //2.3. เปลี่ยน menu เป็น register
      await lineService.lineOaUnLinkMenuToUser(line_id);

      await Transaction_Sms_Otp.update(
        createRequest(),
        {
          status: "deactive",
        },
        {
          line_id: line_id,
        }
      );

      await Transaction_Email_Otp.update(
        createRequest(),
        {
          status: "deactive",
        },
        {
          line_id: line_id,
        }
      );

      //await trans.commit();
      res.status(200).send({
        status: 200,
        message: "ออกจากระบบสำเร็จ",
      });
    } else {
      throw new Error("PIN ไม่ถูกต้อง");
    }
  } catch (error) {
    // if (trans) {
    //   await trans.rollback();
    // }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/logout",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const changePin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //compare request data and validation
    if (
      !validation.compareKeys(
        ["line_id", "pin", "new_pin", "new_pin_confirm"],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.pinSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { line_id, pin, new_pin, new_pin_confirm } = req.body;
    const customer = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: line_id,
      customer_id: req.customer_id,
      status: "active",
    });

    if (!customer) {
      return res
        .status(400)
        .send({ status: 400, message: "ไม่พบข้อมูลผู้ใช้งานของท่าน" });
    }

    if (pin === new_pin) {
      return res.status(400).send({
        status: 400,
        message: "ขออภัย รหัสนี้ถูกใช้งานแล้ว กรุณาตั้งรหัสใหม่",
        type: "duplicate-pin"
      });
    }

    if (new_pin !== new_pin_confirm) {
      return res.status(400).send({
        status: 400,
        message: "ท่านระบุรหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
      });
    }

    await Mapping_Customer_Register.update(
      createRequest(),
      {
        count_wrong_pin: 0,
        expied_date_blocked_pin: null,
        blocked_minutes: 0,
        pin: bcrypt.hashSync(new_pin, 10),
        update_date: new Date(),
      },
      {
        line_id: line_id,
        status: "active",
      }
    );
    let customer_id = req.customer_id;

    let token_id = jwt.sign(
      { line_id, customer_id },
      {
        expiresIn: "2h",
        algorithm: "RS256",
      }
    );

    //ลบ token เดิมออก
    await Transaction_Customer_Login.delete(createRequest(), {
      line_id: line_id,
    });

    await Transaction_Customer_Login.insert(createRequest(), {
      line_id: line_id,
      token_id: token_id,
      status: "active",
    });

    res.status(200).send({
      status: 200,
      message: "เปลี่ยน PIN สำเร็จ",
      data: { token: token_id },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/change-pin",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};

export const forgotPin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //1. compare request data and validation
    if (
      !validation.compareKeys(
        ["line_id", "pin", "new_pin", "new_pin_confirm"],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.pinSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });
    const { line_id, pin, new_pin, new_pin_confirm } = req.body;

    //1. หาข้อมูลลูกค้าจาก line id
    const get_customer = await createRequest().input(
      "line_id",
      sql.NVarChar,
      line_id
    ).query(`
          SELECT TOP 1 t1.Email, t1.FirstName, t1.LastName, t2.*
          FROM Master_Customer t1 
            INNER JOIN Mapping_Customer_Register t2 ON t1.CustomerId = t2.CustomerId
          WHERE t2.LineId = @line_id AND t2.Status = 'active'
        `);

    let customer: any = snakeCaseKeys(get_customer.recordset[0]);
    if (!customer) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลผู้ใช้งานของท่าน",
      });
    }

    if (customer && bcrypt.compareSync(new_pin, customer.pin)) {
      return res.status(400).send({
        status: 400,
        message: "ขออภัย รหัสนี้ถูกใช้งานแล้ว กรุณาตั้งรหัสใหม่",
        type: "duplicate-pin"
      });
    }

    if (new_pin !== new_pin_confirm) {
      return res.status(400).send({
        status: 400,
        message: "ท่านระบุรหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
      });
    }

    //2. ตรวจสอบการยืนยัน PIN
    const check_pin = await Transaction_Email_Otp.findOne(createRequest(), {
      line_id: line_id,
      email: customer.email,
      pin_code: pin,
      status: "success",
    });

    if (!check_pin) {
      return res.status(400).send({
        status: 400,
        message:
          "ท่านระบุรหัสไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านจากอีเมลของท่านหรือกดลืมรหัสผ่าน",
      });
    }

    await Mapping_Customer_Register.update(
      createRequest(),
      {
        count_wrong_pin: 0,
        expied_date_blocked_pin: null,
        blocked_minutes: 0,
        pin: bcrypt.hashSync(new_pin, 10),
        update_date: new Date(),
      },
      {
        line_id: line_id,
        status: "active",
      }
    );
    let customer_id = req.customer_id;

    let token_id = jwt.sign(
      { line_id, customer_id },
      {
        expiresIn: "2h",
        algorithm: "RS256",
      }
    );

    //ลบ token เดิมออก
    await Transaction_Customer_Login.delete(createRequest(), {
      line_id: line_id,
    });

    await Transaction_Customer_Login.insert(createRequest(), {
      line_id: line_id,
      token_id: token_id,
      status: "active",
    });

    await Transaction_Email_Otp.update(
      createRequest(),
      {
        status: "deactive",
      },
      {
        line_id: line_id,
        pin_code: pin,
        status: "success",
      }
    );

    res.status(200).send({
      status: 200,
      message: "รีเซ็ต PIN สำเร็จ",
      data: { token: token_id },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/auth/forgot-pin",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};

export const checkPin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { line_id, pin } = req.body;

    let count_pin: number = 0;
    const customer = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: line_id,
      customer_id: req.customer_id,
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
      await Mapping_Customer_Register.update(
        createRequest(),
        {
          count_wrong_pin: 0,
          expied_date_blocked_pin: null,
          blocked_minutes: 0,
        },
        {
          line_id: line_id,
          status: "active",
        }
      );
      res.status(200).send({
        status: 200,
        message: "PIN ถูกต้อง",
        data: { blocked_pin: false },
      });
    } else {
      const check_pin = await checkWrongPin(
        count_pin,
        customer.count_wrong_pin,
        customer.expied_date_blocked_pin,
        customer.blocked_minutes,
        line_id
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
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const checkBlockedPin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { line_id } = req.body;

    const customer = await Mapping_Customer_Register.findOne(createRequest(), {
      line_id: line_id,
      status: "active",
    });

    if (!customer) {
      return res.status(400).send({
        status: 400,
        message: "ไม่พบข้อมูลผู้ใช้งานของท่าน",
      });
    }

    const check_blocked_pin = await checkDateBlockedPin(
      customer.count_wrong_pin,
      customer.expied_date_blocked_pin,
      customer.blocked_minutes
    );

    return res.status(check_blocked_pin.status).send({
      status: check_blocked_pin.status,
      message: check_blocked_pin.message,
      data: check_blocked_pin.data,
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
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
    message =
      "ท่านระบุรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง (ท่านสามารถระบุรหัสผ่านได้ 3 ครั้ง)";
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
      update_date: new Date(),
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
