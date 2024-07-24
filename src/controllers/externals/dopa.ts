import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import { createRequest, pool } from "../../config";
import { Log_Api } from "../../dbclass";
import moment from "moment";

const private_key = fs.readFileSync(
  path.join(__dirname, "../..", "keys/dopa", "private_key_dopa.pem"),
  "utf8"
);

//ดึงข้อมูลเจ้าของข้อมูล
export const verifyIdCardApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //get token
    let token: any = await getAuthentication();
    //console.log("token:", token);
    if (token.status != 201 && token.status != 200) {
      return res.status(token.status).send({
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      });
    }

    let data: any = req.body;

    //get list identity providers
    const verify_id_card = await dopaVerifyIdCard(token.data.token, data);
    
//   return res.status(verify_id_card.status).send({
    //     status: verify_id_card.status,
    //     message: verify_id_card.data.message,
    //     data: { error: verify_id_card.data.errors },
    //   });
    // }

    // if (verify_id_card.status == 200 && verify_id_card.data.status === "N") {
    //   return res.status(400).send({
    //     status: 400,
    //     message: verify_id_card.data.message,
    //     data: {},
    //   });
    // }

    // res.status(200).send({
    //   status: 200,
    //   message: "success",
    //   data: verify_id_card.data,
    // });    // console.log("verify_id_card:", verify_id_card);
    // if (verify_id_card.status != 200) {
    
    res.status(verify_id_card.status).send(verify_id_card.data);
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/dopa/verify-id-card",
      body: JSON.stringify(req.body),
      error_message: JSON.stringify(error?.message || ""),
    });
    res.status(500).send({ status: 500, message: error?.message || error });
  }
};

export const verifyChipCardApi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //get token
    let token: any = await getAuthentication();
    //console.log("token:", token);
    if (token.status != 201 && token.status != 200) {
      return res.status(token.status).send({
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      });
    }

    let data: any = req.body;

    //get list identity providers
    const verify_chip_card = (await axios({
      method: "POST",
      url: `${process.env.DOPA_API_URL}/dopa/api/verify-chip-card`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token.data.token,
      },
      data: data,
    })) as any;

    // if (verify_id_card.status != 200) {
    //   return res.status(verify_id_card.status).send({
    //     status: verify_id_card.status,
    //     message: verify_id_card.data.message,
    //     data: { error: verify_id_card.data.errors },
    //   });
    // }

    // if (verify_id_card.status == 200 && verify_id_card.data.status === "N") {
    //   return res.status(400).send({
    //     status: 400,
    //     message: verify_id_card.data.message,
    //     data: {},
    //   });
    // }

    res.status(verify_chip_card.status).send(verify_chip_card.data);
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/dopa/api/verify-chip-card",
      body: JSON.stringify(req.body),
      error_message: JSON.stringify(error?.response?.data || ""),
    });
    res.status(error?.response?.status || 500).send(error?.response?.data);
  }
};

export const verifyIdCard = async (data_body: any) => {
  try {
    //get token
    let token: any = await getAuthentication();
    //console.log("token:", token);
    if (token.status != 201 && token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      };
    }

    //get list identity providers
    const verify_id_card = await dopaVerifyIdCard(token.data.token, data_body);
    //console.log("verify_id_card:", verify_id_card);
    if (verify_id_card.status != 200) {
      return {
        status: verify_id_card.status,
        message: verify_id_card.data.message,
        data: { error: verify_id_card.data.errors },
      };
    }

    if (verify_id_card.status == 200 && verify_id_card.data.status === "N") {
      return {
        status: 400,
        message: verify_id_card.data.message,
        data: {},
      };
    }

    return {
      status: 200,
      message: "success",
      data: verify_id_card.data,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};

async function getAuthentication() {
  let body_data = {};
  try {
    let date = moment().format("YYYY-MM-DDTHH:mm:ss");
    let input = process.env.DOPA_CLIENT_ID + "|" + date;

    var signer = crypto.createSign("SHA256");
    signer.update(input);
    var signature = signer
      .sign(private_key, "base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    console.log("signature", signature);
    body_data = {
      client_code: process.env.DOPA_CLIENT_ID,
      key_name: process.env.DOPA_KEY_NAME,
      request_time: date.toString(),
      signature: signature,
    };
    //console.log(body_data);
    const auth_token = (await axios({
      method: "POST",
      url: `${process.env.DOPA_API_URL}/api/auth/token`,
      headers: {
        "Content-Type": "application/json",
      },
      data: body_data,
    })) as any;

    //console.log("Authentication:", auth_token);
    return auth_token;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: "/api/auth/token",
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data || error),
    });

    return error?.response || error;
  }
}

async function dopaVerifyIdCard(token: string, data: any) {
  let body_data = {};
  try {
    body_data = data;

    const verify_id_card = (await axios({
      method: "POST",
      url: `${process.env.DOPA_API_URL}/dopa/api/verify-id-card`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      data: body_data,
    })) as any;

    return verify_id_card;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: "/dopa/api/verify-id-card",
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}
