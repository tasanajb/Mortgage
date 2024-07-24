import _ from "lodash";
import { Log_Api } from "../../dbclass";
import { createRequest, pool } from "../../config";
import axios from "axios";

export const interestRateAll = async () => {
  try {
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    const interest_rate_all = (await axios({
      method: "GET",
      url: `${process.env.BANK_PORTAL_API_URL}/lineoa/interestrateall`,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
    })) as any;

    if (interest_rate_all.status != 200) {
      return {
        status: interest_rate_all.status,
        message: interest_rate_all.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      data: interest_rate_all.data.data || [],
      // data: [
      //   {
      //     id: 1,
      //     bank_code: "BAY",
      //     bank_name: "ธนาคารกรุงศรีอยุธยา จำกัด (มหาชน)",
      //     interest_rate: "3.50%", //อัตราดอกเบี้ย
      //     interest_mrr: 6.65, //MRR
      //     interest_loan: "90%", //วงเงินกู้
      //     interest_year: 30, //ระยะเวลากู้(ปี)
      //     interest_doc: "{url}", //link .pdf
      //     create_date: "08/02/2023 14:33:50", //DD/MM/YYYY hh:mm:sss
      //     update_date: "08/02/2023 14:33:50", //DD/MM/YYYY hh:mm:sss
      //   },
      //   {
      //     id: 2,
      //     bank_code: "SCB",
      //     bank_name: "ธนาคารไทยพาณิชย์ จำกัด (มหาชน)",
      //     interest_rate: "3.50%", //อัตราดอกเบี้ย
      //     interest_mrr: 6.65, //MRR
      //     interest_loan: "90%", //วงเงินกู้
      //     interest_year: 30, //ระยะเวลากู้(ปี)
      //     interest_doc: "{url}", //link .pdf
      //     create_date: "08/02/2023 14:33:50", //DD/MM/YYYY hh:mm:sss
      //     update_date: "08/02/2023 14:33:50", //DD/MM/YYYY hh:mm:sss
      //   },
      // ],
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "GET",
      origin: `${process.env.BANK_PORTAL_API_URL}/lineoa/interestrateall`,
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message: error?.response?.data?.error || error.message,
    };
  }
};

async function getToken() {
  try {
    let bady_data: any = {
      client_id: process.env.BANK_PORTAL_CLIENT_ID,
      client_secret: process.env.BANK_PORTAL_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "loan",
    };
    const token = (await axios({
      method: "POST",
      url: `${process.env.BANK_PORTAL_API_URL}/auth/lineoauth2/token`,
      headers: {
        "Content-Type": "application/json",
      },
      data: bady_data,
    })) as any;

    return token;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: "bankportal: /auth/lineoauth2/token",
      error_message: JSON.stringify(error?.response?.data || ""),
    });

    return error?.response || error;
  }
}
