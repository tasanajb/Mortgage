import axios from "axios";
import {
  Log_Api,
  Master_Loan,
  Master_Ncb,
  Master_Project,
} from "../../dbclass";
import { createRequest, pool } from "../../config";
import sql from "mssql";
import { snakeCaseKeys } from "../../utility";

export const ncbCreditOut = async (data_body: any) => {
  try {
    const credit_out = await creditOut(data_body, "ncb");

    if (credit_out.status != 200) {
      return {
        status: credit_out.status,
        message: credit_out.message,
      };
    }

    return {
      status: 200,
      message: "success"
    };
  } catch (error) {
    return {
      status: error?.status || 500,
      message: error.message,
    };
  }
};

export const checkCredit = async (data_body: any) => {
  try {
    const credit_out = await creditOut(data_body, "check");

    if (credit_out.status != 200) {
      return {
        status: credit_out.status,
        message: credit_out.message,
      };
    }

    return {
      status: 200,
      message: "success"
    };
  } catch (error) {
    return {
      status: error?.status || 500,
      message: error.message,
    };
  }
};

export const loanCreditOut = async (data_body: any) => {
  try {
    const get_loan_ncb = await createRequest()
      .input("loan_id", sql.NVarChar, data_body.loan_id)
      .input("developer_code", sql.NVarChar, data_body.developer_code)
      .query(
        `SELECT TOP 1 t1.LoanId, t1.DeveloperCode, (CASE WHEN t4.NcbId IS NOT NULL THEN 1 ELSE 0 END) as IsCredit ,t1.IsCreditOut, t3.CustomerId, t3.TypeOfBorrower
        FROM Master_loan t1 
        INNER JOIN Master_Project t2 ON t1.DeveloperCode = t2.DeveloperCode
		    INNER JOIN Mapping_Loan t3 ON t1.LoanId = t3.LoanId AND t3.TypeOfBorrower = 'Borrower'
        LEFT JOIN Master_ncb t4 ON t2.ProjectCode = t4.ProjectCode AND getDate() <= t4.NcbDateOfExpiry AND t4.NcbStatusCode <> 'NCB01' AND t3.CustomerId = t4.CustomerId AND t4.UnitId = t1.UnitId
        WHERE t1.LoanId = @loan_id AND t1.DeveloperCode = @developer_code`
      );

    let check_developer_ncb: any = snakeCaseKeys(get_loan_ncb.recordset[0]);
    if(!check_developer_ncb){
      return {
        status: 400,
        message: "ไม่พบข้อมูลของรายการขอสินเชื่อนี้",
      };
    }
    if (!check_developer_ncb.is_credit_out) {
      if (check_developer_ncb.is_credit) {
        data_body.is_credit = false;
      }

      const credit_out = await creditOut(data_body, "loan");

      if (credit_out.status != 200) {
        return {
          status: credit_out.status,
          message: credit_out.message,
        };
      }

      await Master_Loan.update(
        createRequest(),
        {
          is_credit_out: true,
        },
        {
          loan_id: data_body.loan_id,
          developer_code: data_body.developer_code,
        }
      );
    }

    return {
      status: 200,
      message: "success",
    };
  } catch (error) {
    return {
      status: error?.status || 500,
      message: error.message,
    };
  }
};

export const ncbStamps = async (data_body: any) => {
  try {
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    const ncb_stamps = (await axios({
      method: "POST",
      url: `${process.env.WALLET_API_URL}/externals/credit/ncb/stamp`,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
      data: data_body,
    })) as any;

    if (ncb_stamps.status != 200) {
      return {
        status: ncb_stamps.status,
        message: ncb_stamps.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      //data: credit_out.data.data,
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.WALLET_API_URL}/externals/credit/ncb/stamp`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || error.message,
    };
  }
};

async function creditOut(data_body: any, type: string) {
  let api_url: string = "";
  try {
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    if (type === "ncb") {
      api_url = `${process.env.WALLET_API_URL}/externals/credit/ncb/out`;
    }

    if (type === "loan") {
      api_url = `${process.env.WALLET_API_URL}/externals/credit/loan/out`;
    }

    if (type === "ckeck") {
      api_url = `${process.env.WALLET_API_URL}/externals/credit/check`;
    }

    const credit_out = (await axios({
      method: "POST",
      url: api_url,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
      data: data_body,
    })) as any;

    if (credit_out.status != 200) {
      return {
        status: credit_out.status,
        message: credit_out.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: api_url,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || error.message,
    };
  }
}

async function getToken() {
  try {
    let bady_data: any = {
      client_id: process.env.WALLET_CLIENT_ID,
      client_secret: process.env.WALLET_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "wallet",
    };
    const token = (await axios({
      method: "POST",
      url: `${process.env.WALLET_API_URL}/externals/oauth/token`,
      data: bady_data,
    })) as any;

    return token;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.WALLET_API_URL}/externals/oauth/token`,
      error_message: JSON.stringify(error?.response?.data || ""),
    });

    return error?.response || error;
  }
}
