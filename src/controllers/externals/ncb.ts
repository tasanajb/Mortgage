import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import { createRequest, pool } from "../../config";
import { Log_Api, Log_Ncb } from "../../dbclass";
import moment from "moment";

const private_key = fs.readFileSync(
  path.join(__dirname, "../..", "keys", "private_key.pem"),
  "utf8"
);

//ดึงข้อมูลเจ้าของข้อมูล
export const listIdPs = async (citizen_id: string) => {
  try {
    //get token
    let token: any = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      };
    }

    //get list identity providers
    const list_idps = await getlistIdPs(token.data.token, citizen_id);
    //console.log(list_idps);
    if (list_idps.status != 200) {
      return {
        status: list_idps.status,
        message: list_idps.data.message,
        data: { error: list_idps.data.errors },
      };
    }

    //get list identity providers
    const list_idps_on_the_fly = await getlistIdPsOnTheFly(token.data.token);
    //console.log(list_idps);
    if (list_idps_on_the_fly.status != 200) {
      return {
        status: list_idps_on_the_fly.status,
        message: list_idps_on_the_fly.data.message,
        data: { error: list_idps_on_the_fly.data.errors },
      };
    }

    return {
      status: 200,
      message: "success",
      data: {
        id_providers: list_idps?.data?.id_providers || [],
        id_on_the_fly: list_idps_on_the_fly?.data?.id_providers || []
      },
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};

//กดเลือกธนาคาร
//สถานะ NCB "รอดำเนินการ" กดยืนยันแต่ยังไม่เลือกธนาคาร
//mode 1: เลือกธนาคารที่ยังไม่ได้ลงทะเบียน (ธนาคารอื่นๆ) *ต้องไปลงทะเบียนก่อนค่อยกลับมาเลือกธนาคารอีกครั้ง ปรับสถานะ NCB "รอยืนยันตัวตน NDID"
//mode 2: เลือกธนาคารที่ลงทะเบียน (ผู้ให้บริการที่เคยลงทะเบียน) *จะได้หมายเลข Transection Ref กลับมา ปรับสถานะ NCB "กำลังยืนยันตัวตน" จากนั้นรอ call back status และ ปรับสถานะอีกที
export const verifyIdPs = async (data_body: any) => {
  try {
    const { citizen_id, bank_code, bank_mode } = data_body;
    //get token
    const token = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      };
    }

    // Verify an identity with Id
    let data: any = {
      namespace: "citizen_id",
      identifier: citizen_id,
      request_message: "Consent to open an account of a broker",
      idp_id_list: [bank_code],
      min_ial: 2.3,
      min_aal: 2.2,
      min_idp: 1,
      callback_url: process.env.NDID_API_CALLBACK,
      mode: bank_mode,
      bypass_identity_check: true,
      request_timeout: 3600,
    };

    const verify_idps = await identityVerify(token.data.token, data);
    if (verify_idps.status !== 200 && verify_idps.status !== 202) {
      return {
        status: verify_idps.status,
        message: verify_idps.data.message,
        data: { error: verify_idps.data.errors },
      };
    }

    return {
      status: verify_idps?.status || 200,
      message: "success",
      data: verify_idps.data,
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};

//ตรวจสอบ สถานะ
export const checkIdPs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reference_id } = req.body;
    //get token
    const token = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return res.status(token.status).send({
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      });
    }
    // Check Identity verification status
    const check_idps = await checkIdentity(token.data.token, reference_id);
    if (check_idps.status !== 200 && check_idps.status !== 202) {
      return res.status(token.status).send({
        status: check_idps.status,
        message: check_idps.data.message,
        data: { error: check_idps.data.errors },
      });
    }

    res.status(check_idps?.status || 200).send({
      status: check_idps?.status || 200,
      message: "success",
      data: check_idps.data,
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/ncb/idps/check-status",
      body: JSON.stringify(req.body),
      error_message: JSON.stringify(error?.message || ""),
    });
    res.status(500).send({ status: 500, message: error?.message || error });
  }
};

//ถ้าได้สถานะกลับมาแล้ว ปิดจบ case *ปิดทุกสถานะ
export const closeRequestIdPs = async (reference_id: string) => {
  try {
    //get token
    const token = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      };
    }

    // Close Request
    const close_idps = await closeRequest(token.data.token, reference_id);
    if (
      close_idps.status !== 200 &&
      close_idps.status !== 201 &&
      close_idps.status !== 202
    ) {
      return {
        status: close_idps.status,
        message: close_idps.data.message,
        data: { error: close_idps.data.errors },
      };
    }
    //console.log(close_idps);
    return {
      status: close_idps?.status || 200,
      message: "success",
      data: close_idps?.data || {},
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/ncb/idps/close-request",
      body: JSON.stringify({ reference_id: reference_id }),
      error_message: JSON.stringify(error?.message || ""),
    });
    return { status: 500, message: error?.message || error };
  }
};

export const services = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //get token
    const token = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return res.status(token.status).send({
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      });
    }

    const api_services = await apiServices(token.data.token);
    //console.log("services:", api_services);
    if (
      api_services.status !== 200 &&
      api_services.status !== 201 &&
      api_services.status !== 202
    ) {
      return res.status(token.status).send({
        status: api_services.status,
        message: api_services.data.message,
        data: { error: api_services.data.errors },
      });
    }

    res.status(api_services?.status || 200).send({
      status: api_services?.status || 200,
      message: "success",
      data: api_services?.data || {},
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/ncb/services",
      body: JSON.stringify(req.body),
      error_message: JSON.stringify(error?.message || ""),
    });
    res.status(500).send({ status: 500, message: error?.message || error });
  }
};

export const asService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //get token
    const token = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return res.status(token.status).send({
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      });
    }

    const services: any = await apiAsServiceId(
      token.data.token,
      req.body.service_id
    );
    //console.log("as services:", services);
    if (
      services.status !== 200 &&
      services.status !== 201 &&
      services.status !== 202
    ) {
      return res.status(token.status).send({
        status: services.status,
        message: services.data.message,
        data: { error: services.data.errors },
      });
    }

    res.status(services?.status || 200).send({
      status: services?.status || 200,
      message: "success",
      data: services?.data || {},
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/ncb/as-services",
      body: JSON.stringify(req.body),
      error_message: JSON.stringify(error?.message || ""),
    });
    res.status(500).send({ status: 500, message: error?.message || error });
  }
};

export const verifyRequestData = async (data_body: any) => {
  try {
    const {
      citizen_id,
      service_id,
      as_id_list,
      bank_code,
      bank_mode,
      ndid_reference,
    } = data_body;
    let request_params: any = JSON.stringify(data_body.request_params);
    //get token
    const token = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      };
    }

    let data: any = {
      namespace: "citizen_id",
      identifier: citizen_id,
      request_message: process.env.NDID_REQUEST_MESSAGE + ndid_reference,
      idp_id_list: [bank_code],
      min_ial: 2.3,
      min_aal: 2.2,
      min_idp: 1,
      callback_url: process.env.NDID_API_CALLBACK,
      mode: bank_mode,
      bypass_identity_check: true,
      request_timeout: 3600,
      data_request_list: [
        {
          service_id: service_id,
          as_id_list: as_id_list,
          min_as: 1,
          request_params: request_params,
        },
      ],
    };

    const request_data: any = await requestData(token.data.token, data);
    //console.log("request data:", request_data);
    if (
      request_data.status !== 200 &&
      request_data.status !== 201 &&
      request_data.status !== 202
    ) {
      return {
        status: request_data.status,
        message: request_data.data.message,
        data: { error: request_data.data.errors },
      };
    }

    return {
      status: request_data?.status || 200,
      message: "success",
      data: request_data?.data || {},
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};

export const getVerifyRequestData = async (reference_id: string) => {
  try {
    //get token
    const token = await getAuthentication();
    if (token.status != 201 && token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
        data: { error: token.data.errors },
      };
    }

    const request_data: any = await getRequestData(
      token.data.token,
      reference_id
    );
    //console.log("get request data:", request_data);
    if (
      request_data.status !== 200 &&
      request_data.status !== 201 &&
      request_data.status !== 202
    ) {
      return {
        status: request_data.status,
        message: request_data?.data?.message,
        data: { error: request_data?.data?.errors },
      };
    }

    return {
      status: request_data?.status || 200,
      message: "success",
      data: request_data?.data?.data_items[0]?.data || request_data?.data?.data_items || {},
    };
  } catch (error) {
    return { status: 500, message: error?.message || error };
  }
};

async function getAuthentication() {
  let body_data = {};
  try {
    let date = moment().format("YYYY-MM-DDTHH:mm:ss");
    let input = process.env.NDID_CLIENT_CODE + "|" + date;

    var signer = crypto.createSign("SHA256");
    signer.update(input);
    var signature = signer
      .sign(private_key, "base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    body_data = {
      client_code: process.env.NDID_CLIENT_CODE,
      key_name: process.env.NDID_KEY_NAME,
      request_time: date.toString(),

      signature: signature,
    };
    //console.log(body_data);
    const auth_token = (await axios({
      method: "POST",
      url: `${process.env.NDID_API_URL}/api/auth/token`,
      headers: {
        "Content-Type": "application/json",
      },
      data: body_data,
    })) as any;

    //console.log("Authentication:" , auth_token);
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

async function getlistIdPs(token: string, citizen_id: string) {
  let body_data = {};
  try {
    body_data = {
      namespace: "citizen_id",
      identifier: citizen_id,
      min_ial: 2.3, //หมายเลขรหัสระดับการดึงข้อมูล
      min_aal: 2.2,
    };

    const list_idps = (await axios({
      method: "GET",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/identity/providers`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
      data: body_data,
    })) as any;

    //console.log(list_idps);
    return list_idps;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: "/ndidproxy/api/identity/providers",
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}

async function getlistIdPsOnTheFly(token: string) {
  let body_data = {};
  try {
    body_data = {
      min_ial: 2.3,
      min_aal: 2.2,
      on_the_fly_support: true,
    };

    const list_idps = (await axios({
      method: "GET",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/identity/providers`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
      data: body_data,
    })) as any;

    return list_idps;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: "/ndidproxy/api/identity/providers",
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}

async function identityVerify(token: string, data: any) {
  let body_data = {};
  try {
    body_data = data;
    const list_idps = (await axios({
      method: "POST",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/identity/verify`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
      data: body_data,
    })) as any;

    return list_idps;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: "/ndidproxy/api/identity/verify",
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data || ""),
    });

    return error?.response || error;
  }
}

async function checkIdentity(token: string, reference_id: string) {
  try {
    const list_idps = (await axios({
      method: "GET",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/identity/verify/${reference_id}`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
    })) as any;

    return list_idps;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: `/ndidproxy/api/identity/verify/${reference_id}`,
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}

async function closeRequest(token: string, reference_id: string) {
  let body_data = {};
  try {
    body_data = {
      callback_url: process.env.NDID_API_CALLBACk,
    };

    const list_idps = (await axios({
      method: "POST",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/identity/verify/${reference_id}/close`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
      data: body_data,
    })) as any;

    return list_idps;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: `/ndidproxy/api/identity/verify/${reference_id}/close`,
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}

async function apiServices(token: string) {
  let body_data = {};
  try {
    const list_idps = (await axios({
      method: "GET",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/services`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
    })) as any;

    return list_idps;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: `/ndidproxy/api/services`,
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}

async function apiAsServiceId(token: string, service_id: string) {
  let body_data = {};
  try {
    const list_idps = (await axios({
      method: "GET",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/as/${service_id}`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
    })) as any;

    return list_idps;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: `/ndidproxy/api/as/${service_id}`,
      body: JSON.stringify(body_data),
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}

async function requestData(token: string, data: string) {
  try {
    const request_data = (await axios({
      method: "POST",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/identity/verify-and-request-data`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
      data: data,
    })) as any;

    await Log_Ncb.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `/ndidproxy/api/identity/verify-and-request-data`,
      header: JSON.stringify({
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      }),
      body: JSON.stringify(data),
      response: JSON.stringify(request_data.data),
    });

    return request_data;
  } catch (error) {
    await Log_Ncb.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `/ndidproxy/api/identity/verify-and-request-data`,
      header: JSON.stringify({
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      }),
      body: JSON.stringify(data),
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}

async function getRequestData(token: string, reference_id: string) {
  let body_data = {};
  try {
    const request_data = (await axios({
      method: "GET",
      url: `${process.env.NDID_API_URL}/ndidproxy/api/identity/verify-and-request-data/data/${reference_id}`,
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
      },
      params: { token: token },
    })) as any;

    return request_data;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: `/ndidproxy/api/identity/verify-and-request-data/data/${reference_id}`,
      body: reference_id,
      error_message: JSON.stringify(error?.response?.data),
    });

    return error?.response || error;
  }
}
