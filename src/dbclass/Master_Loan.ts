import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_LoanMethod {
  load(request: Request, id: number | IMaster_Loan): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Loan): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Loan {
    id?: number;
    loan_id?: string;
    booking_no?: string;
    contract_id?: string;
    contract_no?: string;
    unit_id?: string;
    quotation_id?: string;
    project_code?: string;
    developer_code?: string;
    loan_type?: string;
    total_collateral_price?: number;
    request_amt?: number;
    down_payment?: number;
    book_amount?: number;
    approve_date?: string;
    book_date?: string;
    status?: string;
    sale_name?: string;
    sale_email?: string;
    count_borrowers?: number;
    is_credit_out?: boolean;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Loan implements IMaster_Loan, IMaster_LoanMethod {
    id?: number;
    loan_id?: string;
    booking_no?: string;
    contract_id?: string;
    contract_no?: string;
    quotation_id?: string;
    unit_id?: string;
    project_code?: string;
    developer_code?: string;
    loan_type?: string;
    total_collateral_price?: number;
    request_amt?: number;
    down_payment?: number;
    book_amount?: number;
    approve_date?: string;
    book_date?: string;
    status?: string;
    sale_name?: string;
    sale_email?: string;
    count_borrowers?: number;
    is_credit_out?: boolean;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Loan",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    loan_id: { name: "LoanId", type: sql.NVarChar, is_identity: false, is_primary: true },
    booking_no: { name: "BookingNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    contract_id: { name: "ContractId", type: sql.NVarChar, is_identity: false, is_primary: false },
    contract_no: { name: "ContractNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    quotation_id: { name: "QuotationId", type: sql.NVarChar, is_identity: false, is_primary: false },
    unit_id: { name: "UnitId", type: sql.NVarChar, is_identity: false, is_primary: false },
    project_code: { name: "ProjectCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    developer_code: { name: "DeveloperCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    loan_type: { name: "LoanType", type: sql.NVarChar, is_identity: false, is_primary: false },
    total_collateral_price: { name: "TotalCollateralPrice", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    request_amt: { name: "RequestAmt", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    down_payment: { name: "DownPayment", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    book_amount: { name: "BookAmount", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    approve_date: { name: "ApproveDate", type: sql.NVarChar, is_identity: false, is_primary: false },
    book_date: { name: "BookDate", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    sale_name: { name: "SaleName", type: sql.NVarChar, is_identity: false, is_primary: false },
    sale_email: { name: "SaleEmail", type: sql.NVarChar, is_identity: false, is_primary: false },
    count_borrowers: { name: "CountBorrowers", type: sql.Int, is_identity: false, is_primary: false },
    is_credit_out: { name: "IsCreditOut", type: sql.Bit, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","loan_id","booking_no","contract_id","contract_no","quotation_id","unit_id","project_code","developer_code","loan_type","total_collateral_price","request_amt","down_payment","book_amount","approve_date","book_date","status","sale_name","sale_email","count_borrowers","is_credit_out","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Loan, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Loan);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Loan.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Loan): void {
    this.id = data.id;
    this.loan_id = data.loan_id;
    this.booking_no = data.booking_no;
    this.contract_id = data.contract_id;
    this.contract_no = data.contract_no;
    this.unit_id = data.unit_id;
    this.quotation_id = data.quotation_id;
    this.project_code = data.project_code;
    this.developer_code = data.developer_code;
    this.loan_type = data.loan_type;
    this.total_collateral_price = data.total_collateral_price;
    this.request_amt = data.request_amt;
    this.down_payment = data.down_payment;
    this.book_amount = data.book_amount;
    this.approve_date = data.approve_date;
    this.book_date = data.book_date;
    this.status = data.status;
    this.sale_name = data.sale_name;
    this.sale_email = data.sale_email;
    this.count_borrowers = data.count_borrowers;
    this.is_credit_out = data.is_credit_out;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Loan.insert(request, {
      id: this.id,
      loan_id: this.loan_id,
      booking_no: this.booking_no,
      contract_id: this.contract_id,
      contract_no: this.contract_no,
      quotation_id: this.quotation_id,
      unit_id: this.unit_id,
      project_code: this.project_code,
      developer_code: this.developer_code,
      loan_type: this.loan_type,
      total_collateral_price: this.total_collateral_price,
      request_amt: this.request_amt,
      down_payment: this.down_payment,
      book_amount: this.book_amount,
      approve_date: this.approve_date,
      book_date: this.book_date,
      status: this.status,
      sale_name: this.sale_name,
      sale_email: this.sale_email,
      count_borrowers: this.count_borrowers,
      is_credit_out: this.is_credit_out,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Loan.update(request, {
      id: this.id,
      loan_id: this.loan_id,
      booking_no: this.booking_no,
      contract_id: this.contract_id,
      contract_no: this.contract_no,
      quotation_id: this.quotation_id,
      unit_id: this.unit_id,
      project_code: this.project_code,
      developer_code: this.developer_code,
      loan_type: this.loan_type,
      total_collateral_price: this.total_collateral_price,
      request_amt: this.request_amt,
      down_payment: this.down_payment,
      book_amount: this.book_amount,
      approve_date: this.approve_date,
      book_date: this.book_date,
      status: this.status,
      sale_name: this.sale_name,
      sale_email: this.sale_email,
      count_borrowers: this.count_borrowers,
      is_credit_out: this.is_credit_out,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Loan.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Loan): Promise<Master_Loan[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Loan(item));
  }

  static async findOne(request: Request, condition: IMaster_Loan): Promise<Master_Loan> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Loan(item);
  }

  static async count(request: Request, condition: IMaster_Loan): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Loan): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Loan, condition: IMaster_Loan): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Loan): Promise<void> {
      return this.builder.delete(request, condition);
  }
}