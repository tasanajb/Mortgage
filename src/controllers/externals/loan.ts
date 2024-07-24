import { snakeCaseKeys } from "../../utility";
import axios from "axios";
import { createRequest, pool } from "../../config";
import { NextFunction, Request, Response } from "express";
import {
  Log_Api,
  Master_Bank,
  Master_Developer,
  Master_Loan,
} from "../../dbclass";
import sql from "mssql";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

export const sendDocument = async (data_body: any) => {
  try {
    const { developer_code, data } = data_body;

    //1. หา Master Developer
    const developer = await Master_Developer.findOne(createRequest(), {
      developer_code: developer_code,
    });

    //3. หา Booking No เลขที่ใบจอง
    const loand_data = await Master_Loan.findOne(createRequest(), {
      loan_id: data.refNo,
    });

    //เผื่อใช้อ้างอิง
    const booking_no = loand_data.booking_no;

    let result = await axios({
      method: "POST",
      url: `${developer.url_api}/loan/UpLoadFileMortgage`,
      //url: `https://mortgage.iconrem.com/remapiv2/loan/UpLoadFileMortgage`,
      headers: JSON.parse(developer.header_api),
      data: data,
    });

    return {
      status: 200,
      message: "success",
      data: snakeCaseKeys(result.data.Data),
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: "/loan/UpLoadFileMortgage",
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message: error?.response?.data?.error || error.message,
    };
  }
};

export const loanAll = async (data_body: any) => {
  try {
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    const loan_list = (await axios({
      method: "POST",
      url: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanall`,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
      data: {
        citizen_id: data_body.citizen_id,
        //citizen_id: "1234567890111",
      },
    })) as any;

    if (loan_list.status != 200) {
      return {
        status: loan_list.status,
        message: loan_list.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      data: loan_list.data.data,
      // data: [
      //   {
      //     booking_no: "BO-102-220042",
      //     contract_no: "CO-102-220014",
      //     developer_id: "Mortgage_STD_DEV",
      //     developer_name: "บริษัท ไอคอน เฟรมเวิร์ค จำกัด",
      //     project_id: "102",
      //     project_name: "กัลปพฤกษ์ แกรนด์ พาร์ค เชียงราย",
      //     unit_id: "102-A0118",
      //     unit_no: "A0118",
      //     count_approve: 1, //approve-2
      //     count_reject: 0, //reject
      //     count_inprocess: 1, //inprocess
      //   },
      //   {
      //     booking_no: "BO-102-220043",
      //     contract_no: "CO-102-220016",
      //     developer_id: "Mortgage_STD_DEV",
      //     developer_name: "บริษัท ไอคอน เฟรมเวิร์ค จำกัด",
      //     project_id: "102",
      //     project_name: "กัลปพฤกษ์ แกรนด์ พาร์ค เชียงราย",
      //     unit_id: "102-A0119",
      //     unit_no: "A0119",
      //     count_approve: 1, //approve-2
      //     count_reject: 1, //reject
      //     count_inprocess: 2, //inprocess
      //   },
      // ],
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanall`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message,
    };
  }
};

export const loanDetail = async (data_body: any) => {
  try {
    const { citizen_id, unit_id, unit_no, booking_no } = data_body;
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    const loan_detail = (await axios({
      method: "POST",
      url: `${process.env.BANK_PORTAL_API_URL}/lineoa/loandetail`,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
      data: {
        citizen_id: citizen_id,
        //citizen_id: "1234567890111",
        unit_id: unit_id,
        unit_no: unit_no,
        booking_no: booking_no,
      },
    })) as any;

    if (loan_detail.status != 200) {
      return {
        status: loan_detail.status,
        message: loan_detail.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      data: loan_detail.data.data,
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.BANK_PORTAL_API_URL}/lineoa/loandetail`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message,
    };
  }
};

export const loanBankDetail = async (data_body: any) => {
  try {
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    const loan_detail = (await axios({
      method: "POST",
      url: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanbankdetail`,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
      data: {
        document_no: data_body.document_no,
      },
    })) as any;

    if (loan_detail.status != 200) {
      return {
        status: loan_detail.status,
        message: loan_detail.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      data: loan_detail.data.data,
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanbankdetail`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message,
    };
  }
};

export const loanBankSelect = async (data_body: any) => {
  try {
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    const loan_detail = (await axios({
      method: "POST",
      url: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanbankselect`,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
      data: {
        document_no: data_body.document_no,
      },
    })) as any;

    if (loan_detail.status != 200) {
      return {
        status: loan_detail.status,
        message: loan_detail.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      data: loan_detail.data.data,
      //data: "เลือกธนาคารสำเร็จ",
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanbankselect`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message,
    };
  }
};

export const loanUnselectBank = async (data_body: any) => {
  try {
    const token = await getToken();
    if (token.status != 200) {
      return {
        status: token.status,
        message: token.data.message,
      };
    }

    const loan_detail = (await axios({
      method: "POST",
      url: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanbankunselect`,
      headers: {
        authorization: "Bearer " + token.data.access_token,
      },
      data: {
        document_no: data_body.document_no,
      },
    })) as any;

    if (loan_detail.status != 200) {
      return {
        status: loan_detail.status,
        message: loan_detail.data.message,
      };
    }

    return {
      status: 200,
      message: "success",
      data: loan_detail.data.data,
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.BANK_PORTAL_API_URL}/lineoa/loanbankunselect`,
      body: JSON.stringify(data_body),
      error_message: JSON.stringify(error?.response?.data) || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message,
    };
  }
};

export const addNewLoanToRem = async (
  loan_id: string,
  select_bank: any,
  developer_code: string
) => {
  try {
    const account_name = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
    if (!account_name) throw Error("Azure Storage accountName not found");
    const accountKey = process.env.AZURE_STORAGE_KEY || "";
    const shared_key_credential = new StorageSharedKeyCredential(
      account_name,
      accountKey
    );
    const blob_service_client = new BlobServiceClient(
      `https://${account_name}.blob.core.windows.net`,
      shared_key_credential
    );
    let blob_service_client_url = blob_service_client.url;
    let loan_customer: any = [];
    //1. หาข้อมูลผู้กู้ทั้งหมด loanCustomer
    const get_customer_loan = await createRequest().input(
      "loan_id",
      sql.NVarChar,
      loan_id
    ).query(`
    SELECT DISTINCT t1.ContractId, t1.LoanId, t2.CustomerId, t3.CitizenId, t2.TypeOfBorrower, 
    ISNULL(t4.Income, 0) as Incomes, ISNULL(t4.Ot, 0) as Ot, ISNULL(t4.Commission, 0) as Commission, 
    ISNULL(t4.Bonus, 0) as Bonus, ISNULL(t4.ServiceCharge, 0) as ServiceCharge, ISNULL(t4.Perdiem, 0) as Perdiem, 
    ISNULL(t4.IncomeOtherFix, 0) as IncomeOtherFix, ISNULL(t4.IncomeOtherNotFix, 0) as IncomeOtherNotFix, 
    ISNULL(t4.IncomeExtra, 0) as IncomeExtra, ISNULL(t4.IncomeRental, 0) as IncomeRental, ISNULL(t4.TotalIncome, 0) as TotalIncome,
    ISNULL(t4.PaySocialInsurance, 0) as PaySocialInsurance, ISNULL(t4.PaySlipTax, 0) as PaySlipTax, ISNULL(t4.PaySlipCooperative, 0) as PaySlipCooperative,
    ISNULL(t4.PaySlipOther, 0) as PaySlipOther, ISNULL(t4.PayProvidentfund, 0) as PayProvidentfund, ISNULL(t4.PayHomeLoan, 0) as PayHomeLoan,
    ISNULL(t4.PayCarLoan, 0) as PayCarLoan, ISNULL(t4.DebtTotalCreditCard, 0) as DebtTotalCreditCard, ISNULL(t4.DebtCreditCardPerMonth, 0) as DebtCreditCardPerMonth,
    ISNULL(t4.DebtOther, 0) as DebtOther, ISNULL(t4.TotalDebt, 0) as TotalDebt, t4.DebtCashCard,
    ISNULL(t4.CompanyBusinessTypeId, '') as CompanyBusinessType, ISNULL(t4.CompanyBusinessTypeName, '') as CompanyBusinessTypeName,
    ISNULL(t4.WelfareId, '') as Welfare, ISNULL(t4.WelfareName, '') as WelfareName, ISNULL(t4.NumberOfDebtHouse, 0) as NumberOfDebtHouse, ISNULL(t4.WelfareBankType, '[]') as WelfareBankType,
    ISNULL(t4.NumberOfHouse, '') as HouseNo
    FROM Master_Loan t1
    INNER JOIN Mapping_Loan t2 ON t1.LoanId = t2.LoanId
    INNER JOIN Master_Customer t3 ON t2.CustomerId = t3.CustomerId
    LEFT JOIN Master_Customer_Loan t4 ON t2.CustomerId = t4.CustomerId AND t1.LoanId = t4.LoanId
    WHERE t1.LoanId =  @loan_id
    `);

    let customer_loan: any = snakeCaseKeys(get_customer_loan.recordset);
    let contract_id: string = customer_loan[0].contract_id;
    //loop เก็บข้อมูลต่างๆ ของผู้กู้
    for (var i in customer_loan) {
      //1.1. welfare Bank Type : หา master bank และ map bank id กับ name
      let welfare_bank_type: any;
      let welfare_bank = JSON.parse(customer_loan[i]?.welfare_bank_type) || [];
      let get_welfare_bank_type: any = await createRequest()
        .input("welfare_bank", sql.NVarChar, welfare_bank.join(","))
        .query(
          `DECLARE @TempTable TABLE (Bank NVARCHAR(50))
        INSERT INTO @TempTable (Bank) SELECT value FROM STRING_SPLIT(@welfare_bank, ',')
        SELECT BankCode as bankId, Name as bankName
        FROM Master_Bank
          WHERE BankCode IN( SELECT Bank FROM @TempTable)`
        );

      welfare_bank_type = get_welfare_bank_type.recordset || [];
      //1.2. หา file เอกสาร
      let get_file: any = await createRequest()
        .input("loan_id", sql.NVarChar, loan_id)
        .input("customer_id", sql.NVarChar, customer_loan[i]?.customer_id)
        .input("blob_url", sql.NVarChar, blob_service_client_url).query(`
        DECLARE @Url AS VARCHAR(50) = @blob_url
      SELECT FileName as fileName, FileType as fileType,
      (CASE WHEN FileExtension = 'jpeg' THEN '1'
           WHEN FileExtension = 'jpg' THEN '1'
         WHEN FileExtension = 'png' THEN '2'
           WHEN FileExtension = 'pdf' THEN '3'
         ELSE '' END) AS 'FileType' , 
      FileExtension as 'fileTypeName', 
      GroupType as 'docType',
      (CASE WHEN GroupType = '2' THEN 'เอกสารส่วนตัว'
           WHEN GroupType = '3' THEN 'NCB'
         WHEN GroupType = '4' THEN 'เอกสารรายได้'
           WHEN GroupType = '5' THEN 'Statement'
         END) AS 'docTypeName',
         CONCAT( @Url , FilePath) as fileUrl
      FROM Master_File 
      WHERE  CustomerId = @customer_id AND RefId = @loan_id AND (GroupType IN('2','3','4','5')) AND Status = 'active'
      `);

      //1.3. หา password file ncb
      let ncb_report = (await axios({
        method: "POST",
        url: `${process.env.SERVICE_MATCHING_API_URL}/ncb/password`,
        data: {
          loan_id: loan_id,
          user_id: customer_loan[i].citizen_id,
          // loan_id: "LOAN-202301000015",
          // user_id: "1670800177927"
        },
      })) as any;

      //1.4. เก็บข้อมูลการขอสินเชื่อ รายได้รายจ่าย สวัสดิการ และ file เอกสาร
      let customer_data = {
        citizenId: customer_loan[i].citizen_id,
        income: {
          incomes: customer_loan[i].incomes || 0,
          ot: customer_loan[i].ot || 0,
          commission: customer_loan[i].commission || 0,
          bonus: customer_loan[i].bonus || 0,
          serviceCharge: customer_loan[i].service_charge || 0,
          perdiem: customer_loan[i].perdiem || 0,
          incomeOtherFix: customer_loan[i].income_other_fix || 0,
          incomeOtherNotFix: customer_loan[i].income_other_not_fix || 0,
          incomeExtra: customer_loan[i].income_extra || 0,
          incomeRental: customer_loan[i].income_rental || 0,
          salesAmount: 0,
          netIncome: 0,
          shareholder: 0,
          totalIncome: customer_loan[i].total_income || 0,
        },
        pay: {
          paySocialInsurance: customer_loan[i].pay_social_insurance || 0,
          paySlipTax: customer_loan[i].pay_slip_tax || 0,
          paySlipCooperative: customer_loan[i].pay_slip_cooperative || 0,
          paySlipOther: customer_loan[i].pay_slip_other || 0,
          payProvidentfund: customer_loan[i].pay_providentfund || 0,
          payHomeLoan: customer_loan[i].pay_homeLoan || 0,
          payCarLoan: customer_loan[i].pay_carLoan || 0,
          personalLoan: 0,
          debtTotalCreditCard: customer_loan[i].debt_total_credit_card || 0,
          debtCreditCardPerMonth:
            customer_loan[i].debt_credit_card_per_month || 0,
          debtOther: customer_loan[i].debt_other || 0,
          totalDebt: customer_loan[i].total_debt || 0,
        },
        companyBusinessType: customer_loan[i].company_business_type || "",
        companyBusinessTypeName:
          customer_loan[i].company_business_type_name || "",
        welfare: customer_loan[i].welfare === "1" ? "yes" : "no" || "",
        welfareName: customer_loan[i].welfare_name || "",
        numberOfDebtHouse: customer_loan[i].number_of_debt_house || 0,
        welfareBankType: welfare_bank_type || [],
        houseNo: customer_loan[i].house_no || "",
        files: get_file?.recordset || [],
        filePassword: ncb_report?.data?.password || "",
        gradeBureau: ncb_report?.data?.grade_bureau || "",
      };

      loan_customer.push(customer_data);
    }
    //console.log("loan_customer: ", loan_customer);
    //2. map ข้อมูลการเลือกธนาคาร
    const map_bank: any = await createRequest()
      .input("select_bank", sql.NVarChar, select_bank.join(","))
      .query(
        `DECLARE @TempTable TABLE (Bank NVARCHAR(50))
        INSERT INTO @TempTable (Bank) SELECT value FROM STRING_SPLIT(@select_bank, ',')
        SELECT BankCode as bankId, Name as bankName
        FROM Master_Bank
          WHERE BankCode IN( SELECT Bank FROM @TempTable)`
      );

    //3. ส่งข้อมูลไป rem api
    const developer = await Master_Developer.findOne(createRequest(), {
      developer_code: developer_code,
    });

    if (!developer) {
      return { status: 400, message: "ไม่พบข้อมูลบริษัท" };
    }

    let headers: any = JSON.parse(developer.header_api);
    let url_api = developer.url_api;

    const rem_add_loan = (await axios({
      method: "POST",
      url: `${url_api}/loan/addNewLoan`,
      headers: headers,
      data: {
        contractId: contract_id,
        loanCustomer: loan_customer,
        bank: map_bank.recordset || [],
      },
    })) as any;

    if (rem_add_loan.data.statusCode != 200) {
      return {
        status: rem_add_loan.data.statusCode,
        message: rem_add_loan.data.statusDesc,
      };
    }

    return {
      status: 200,
      message: "success",
      data: snakeCaseKeys(rem_add_loan.data.data),
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: "/loan/addNewLoan",
      body: JSON.stringify({ loan_id: loan_id }),
      error_message: error?.response?.data?.message || error.message,
    });
    return {
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || error.message,
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
      data: bady_data,
    })) as any;

    return token;
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "outbound",
      method: "POST",
      origin: `${process.env.BANK_PORTAL_API_URL}/auth/lineoauth2/token`,
      error_message: JSON.stringify(error?.response?.data || ""),
    });

    return error?.response || error;
  }
}
