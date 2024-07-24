import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMapping_Loan_BankMethod {
  load(request: Request, id: number | IMapping_Loan_Bank): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMapping_Loan_Bank): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMapping_Loan_Bank {
    id?: number;
    loan_id?: string;
    bank_code?: string;
    customer_id?: string;
    is_select_bank?: boolean;
    create_date?: Date;
    update_date?: Date;
}

export class Mapping_Loan_Bank implements IMapping_Loan_Bank, IMapping_Loan_BankMethod {
    id?: number;
    loan_id?: string;
    bank_code?: string;
    customer_id?: string;
    is_select_bank?: boolean;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Mapping_Loan_Bank",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    loan_id: { name: "LoanId", type: sql.NVarChar, is_identity: false, is_primary: false },
    bank_code: { name: "BankCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    is_select_bank: { name: "IsSelectBank", type: sql.Bit, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","loan_id","bank_code","customer_id","is_select_bank","create_date","update_date"]
  );

  constructor(request?: Request | IMapping_Loan_Bank, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMapping_Loan_Bank);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Mapping_Loan_Bank.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMapping_Loan_Bank): void {
    this.id = data.id;
    this.loan_id = data.loan_id;
    this.bank_code = data.bank_code;
    this.customer_id = data.customer_id;
    this.is_select_bank = data.is_select_bank;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Mapping_Loan_Bank.insert(request, {
      id: this.id,
      loan_id: this.loan_id,
      bank_code: this.bank_code,
      customer_id: this.customer_id,
      is_select_bank: this.is_select_bank,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Mapping_Loan_Bank.update(request, {
      id: this.id,
      loan_id: this.loan_id,
      bank_code: this.bank_code,
      customer_id: this.customer_id,
      is_select_bank: this.is_select_bank,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Mapping_Loan_Bank.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMapping_Loan_Bank): Promise<Mapping_Loan_Bank[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Mapping_Loan_Bank(item));
  }

  static async findOne(request: Request, condition: IMapping_Loan_Bank): Promise<Mapping_Loan_Bank> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Mapping_Loan_Bank(item);
  }

  static async count(request: Request, condition: IMapping_Loan_Bank): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMapping_Loan_Bank): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMapping_Loan_Bank, condition: IMapping_Loan_Bank): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMapping_Loan_Bank): Promise<void> {
      return this.builder.delete(request, condition);
  }
}