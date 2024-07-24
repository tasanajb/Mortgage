import { NextFunction, Request, Response } from "express";
import { createRequest, pool } from "../../config";
import {
  Log_Api,
  Master_Customer,
  Transaction_Email_Otp,
  Master_Customer_Address,
  Master_SubDistrict,
} from "../../dbclass";
import sql from "mssql";
import * as validation from "../validation";
import { snakeCaseKeys } from "../../utility";

export const detail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customer = await Master_Customer.findOne(createRequest(), {
      customer_id: req.customer_id,
    });

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        customer_id: customer.customer_id,
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email,
        citizen_id: customer.citizen_id,
        mobile_number: customer.mobile_number,
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/customer/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let trans = new sql.Transaction(pool);
  try {
    await trans.begin();
    //compare request data and validation
    if (!validation.compareKeys(["line_id", "pin", "email"], req.body)) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.updateEmailSchema
      .validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        strict: true,
      })
      .catch((error: any) => {
        throw { status: 400, message: error.errors[0] || error.message };
      });

    const { line_id, email } = req.body;
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

    await Master_Customer.update(
      createRequest(trans),
      {
        email: email,
        update_date: new Date(),
      },
      {
        customer_id: req.customer_id,
      }
    );

    await trans.commit();

    res.status(200).send({
      status: 200,
      message: "แก้ไขอีเมลสำเร็จ",
    });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/customer/update",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};

export const addressSendDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customer_address = await Master_Customer_Address.findOne(
      createRequest(),
      {
        customer_id: req.customer_id,
        //address_type: 5,
        address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
      }
    );

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        address: customer_address?.address || "",
        village: customer_address?.village || "",
        moo: customer_address?.moo || "",
        floor: customer_address?.floor || "",
        soi: customer_address?.soi || "",
        road: customer_address?.road || "",
        sub_district_id: customer_address?.sub_district_id || "",
        sub_district_name: customer_address?.sub_district_name || "",
        district_id: customer_address?.district_id || "",
        district_name: customer_address?.district_name || "",
        province_id: customer_address?.province_id || "",
        province_name: customer_address?.province_name || "",
        post_code: customer_address?.post_code || "",
        address_type:
          customer_address?.address_type_name || "ที่อยู่ในการจัดส่งเอกสาร",
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/customer/address-send-doc/detail",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const updateAddressSendDoc = async (
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
          "pin",
          "address",
          "village",
          "moo",
          "floor",
          "soi",
          "road",
          "sub_district_id",
          "district_id",
          "province_id",
          "post_code",
        ],
        req.body
      )
    ) {
      throw {
        status: 400,
        message: "ขออภัย ข้อมูลที่ส่งมาไม่เป็นไปตามที่กำหนด",
      };
    }
    await validation.addressSchema
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
      address,
      village,
      moo,
      floor,
      soi,
      road,
      sub_district_id,
      district_id,
      province_id,
      post_code,
    } = req.body;

    //address_type: 5 ที่อยู่จัดส่งเอกสาร
    const customer_address = await Master_Customer_Address.findOne(
      createRequest(),
      {
        customer_id: req.customer_id,
        //address_type: 5,
        address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
      }
    );

    const get_master_address = await createRequest()
      .input("sub_district_id", sql.NVarChar, sub_district_id)
      .query(
        `SELECT t1.NameTh as SubDistrictName, t2.NameTh as DistrictName, t3.NameTh as ProvinceName
      FROM Master_SubDistrict t1
      INNER JOIN Master_District t2 ON t1.DistrictId = t2.DistrictId
      INNER JOIN Master_Province t3 ON t1.ProvinceId = t3.ProvinceId
      where t1.SubDistrictId = @sub_district_id`
      );

    const master_address = snakeCaseKeys(get_master_address.recordset[0]);

    if (!customer_address) {
      await Master_Customer_Address.insert(createRequest(trans), {
        address: address,
        village: village,
        moo: moo,
        floor: floor,
        soi: soi,
        road: road,
        sub_district_id: sub_district_id,
        sub_district_name: master_address.sub_district_name,
        district_id: district_id,
        district_name: master_address.district_name,
        province_id: province_id,
        province_name: master_address.province_name,
        post_code: post_code,
        customer_id: req.customer_id,
        address_type: 5,
        address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
      });
    } else {
      await Master_Customer_Address.update(
        createRequest(trans),
        {
          address: address,
          village: village,
          moo: moo,
          floor: floor,
          soi: soi,
          road: road,
          sub_district_id: sub_district_id,
          sub_district_name: master_address.sub_district_name,
          district_id: district_id,
          district_name: master_address.district_name,
          province_id: province_id,
          province_name: master_address.province_name,
          post_code: post_code,
          update_date: new Date(),
        },
        {
          customer_id: req.customer_id,
          address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
        }
      );
    }

    await trans.commit();
    res.status(200).send({
      status: 200,
      message: "แก้ไขที่อยู่จัดส่งเอกสารสำเร็จ",
    });
  } catch (error) {
    if (trans) {
      await trans.rollback();
    }
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/customer/address-send-doc/update",
      body: JSON.stringify(req.body),
      error_message: error.message,
    });
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};
