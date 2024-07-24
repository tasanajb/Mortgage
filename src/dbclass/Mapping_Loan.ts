import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMapping_LoanMethod {
  load(request: Request, id: number | IMapping_Loan): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMapping_Loan): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMapping_Loan {
    id?: number;
    loan_id?: string;
    customer_id?: string;
    type_of_borrower?: string;
    seq_of_borrower?: number;
    relation_with_borrower?: string;
    customer_address?: string;
    customer_data?: string;
    mobile_number?: string;
    email?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Mapping_Loan implements IMapping_Loan, IMapping_LoanMethod {
    id?: number;
    loan_id?: string;
    customer_id?: string;
    type_of_borrower?: string;
    seq_of_borrower?: number;
    relation_with_borrower?: string;
    customer_address?: string;
    customer_data?: string;
    mobile_number?: string;
    email?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Mapping_Loan",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    loan_id: { name: "LoanId", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    type_of_borrower: { name: "TypeOfBorrower", type: sql.NVarChar, is_identity: false, is_primary: false },
    seq_of_borrower: { name: "SeqOfBorrower", type: sql.Int, is_identity: false, is_primary: false },
    relation_with_borrower: { name: "RelationWithBorrower", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_address: { name: "CustomerAddress", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_data: { name: "CustomerData", type: sql.NVarChar, is_identity: false, is_primary: false },
    mobile_number: { name: "MobileNumber", type: sql.NVarChar, is_identity: false, is_primary: false },
    email: { name: "Email", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","loan_id","customer_id","type_of_borrower","seq_of_borrower","relation_with_borrower","customer_address","customer_data","mobile_number","email","status","create_date","update_date"]
  );

  constructor(request?: Request | IMapping_Loan, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMapping_Loan);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Mapping_Loan.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMapping_Loan): void {
    this.id = data.id;
    this.loan_id = data.loan_id;
    this.customer_id = data.customer_id;
    this.type_of_borrower = data.type_of_borrower;
    this.seq_of_borrower = data.seq_of_borrower;
    this.relation_with_borrower = data.relation_with_borrower;
    this.customer_address = data.customer_address;
    this.customer_data = data.customer_data;
    this.mobile_number = data.mobile_number;
    this.email = data.email;
    this.status = data.status;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Mapping_Loan.insert(request, {
      id: this.id,
      loan_id: this.loan_id,
      customer_id: this.customer_id,
      type_of_borrower: this.type_of_borrower,
      seq_of_borrower: this.seq_of_borrower,
      relation_with_borrower: this.relation_with_borrower,
      customer_address: this.customer_address,
      customer_data: this.customer_data,
      mobile_number: this.mobile_number,
      email: this.email,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Mapping_Loan.update(request, {
      id: this.id,
      loan_id: this.loan_id,
      customer_id: this.customer_id,
      type_of_borrower: this.type_of_borrower,
      seq_of_borrower: this.seq_of_borrower,
      relation_with_borrower: this.relation_with_borrower,
      customer_address: this.customer_address,
      customer_data: this.customer_data,
      mobile_number: this.mobile_number,
      email: this.email,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Mapping_Loan.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMapping_Loan): Promise<Mapping_Loan[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Mapping_Loan(item));
  }

  static async findOne(request: Request, condition: IMapping_Loan): Promise<Mapping_Loan> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Mapping_Loan(item);
  }

  static async count(request: Request, condition: IMapping_Loan): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMapping_Loan): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMapping_Loan, condition: IMapping_Loan): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMapping_Loan): Promise<void> {
      return this.builder.delete(request, condition);
  }
}