import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ITransaction_InquiryMethod {
  load(request: Request, id: number | ITransaction_Inquiry): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ITransaction_Inquiry): void;
  insert(request: Request): Promise<string | number>;
}

export interface ITransaction_Inquiry {
    id?: number;
    customer_id?: string;
    subject_id?: string;
    subject_name?: string;
    detail?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Transaction_Inquiry implements ITransaction_Inquiry, ITransaction_InquiryMethod {
    id?: number;
    customer_id?: string;
    subject_id?: string;
    subject_name?: string;
    detail?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Transaction_Inquiry",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    subject_id: { name: "SubjectId", type: sql.NVarChar, is_identity: false, is_primary: false },
    subject_name: { name: "SubjectName", type: sql.NVarChar, is_identity: false, is_primary: false },
    detail: { name: "Detail", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","customer_id","subject_id","subject_name","detail","create_date","update_date"]
  );

  constructor(request?: Request | ITransaction_Inquiry, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ITransaction_Inquiry);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Transaction_Inquiry.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ITransaction_Inquiry): void {
    this.id = data.id;
    this.customer_id = data.customer_id;
    this.subject_id = data.subject_id;
    this.subject_name = data.subject_name;
    this.detail = data.detail;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Transaction_Inquiry.insert(request, {
      id: this.id,
      customer_id: this.customer_id,
      subject_id: this.subject_id,
      subject_name: this.subject_name,
      detail: this.detail,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Transaction_Inquiry.update(request, {
      id: this.id,
      customer_id: this.customer_id,
      subject_id: this.subject_id,
      subject_name: this.subject_name,
      detail: this.detail,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Transaction_Inquiry.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ITransaction_Inquiry): Promise<Transaction_Inquiry[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Transaction_Inquiry(item));
  }

  static async findOne(request: Request, condition: ITransaction_Inquiry): Promise<Transaction_Inquiry> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Transaction_Inquiry(item);
  }

  static async count(request: Request, condition: ITransaction_Inquiry): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ITransaction_Inquiry): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ITransaction_Inquiry, condition: ITransaction_Inquiry): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ITransaction_Inquiry): Promise<void> {
      return this.builder.delete(request, condition);
  }
}