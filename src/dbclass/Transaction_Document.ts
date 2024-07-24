import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ITransaction_DocumentMethod {
  load(request: Request, id: number | ITransaction_Document): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ITransaction_Document): void;
  insert(request: Request): Promise<string | number>;
}

export interface ITransaction_Document {
    id?: number;
    ref_file_id?: number;
    loan_id?: string;
    customer_id?: string;
    file_name?: string;
    file_path?: string;
    doc_type?: number;
    file_type?: number;
    developer_code?: string;
    rem_file_id?: string;
    rem_link_url?: string;
    status?: string;
    error_message?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Transaction_Document implements ITransaction_Document, ITransaction_DocumentMethod {
    id?: number;
    ref_file_id?: number;
    loan_id?: string;
    customer_id?: string;
    file_name?: string;
    file_path?: string;
    doc_type?: number;
    file_type?: number;
    developer_code?: string;
    rem_file_id?: string;
    rem_link_url?: string;
    status?: string;
    error_message?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Transaction_Document",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    ref_file_id: { name: "RefFileId", type: sql.Int, is_identity: false, is_primary: false },
    loan_id: { name: "LoanId", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    file_name: { name: "FileName", type: sql.NVarChar, is_identity: false, is_primary: false },
    file_path: { name: "FilePath", type: sql.NVarChar, is_identity: false, is_primary: false },
    doc_type: { name: "DocType", type: sql.Int, is_identity: false, is_primary: false },
    file_type: { name: "FileType", type: sql.Int, is_identity: false, is_primary: false },
    developer_code: { name: "DeveloperCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    rem_file_id: { name: "RemFileId", type: sql.NVarChar, is_identity: false, is_primary: false },
    rem_link_url: { name: "RemLinkUrl", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    error_message: { name: "ErrorMessage", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","ref_file_id","loan_id","customer_id","file_name","file_path","doc_type","file_type","developer_code","rem_file_id","rem_link_url","status","error_message","create_date","update_date"]
  );

  constructor(request?: Request | ITransaction_Document, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ITransaction_Document);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Transaction_Document.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ITransaction_Document): void {
    this.id = data.id;
    this.ref_file_id = data.ref_file_id;
    this.loan_id = data.loan_id;
    this.customer_id = data.customer_id;
    this.file_name = data.file_name;
    this.file_path = data.file_path;
    this.doc_type = data.doc_type;
    this.file_type = data.file_type;
    this.developer_code = data.developer_code;
    this.rem_file_id = data.rem_file_id;
    this.rem_link_url = data.rem_link_url;
    this.status = data.status;
    this.error_message = data.error_message;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Transaction_Document.insert(request, {
      id: this.id,
      ref_file_id: this.ref_file_id,
      loan_id: this.loan_id,
      customer_id: this.customer_id,
      file_name: this.file_name,
      file_path: this.file_path,
      doc_type: this.doc_type,
      file_type: this.file_type,
      developer_code: this.developer_code,
      rem_file_id: this.rem_file_id,
      rem_link_url: this.rem_link_url,
      status: this.status,
      error_message: this.error_message,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Transaction_Document.update(request, {
      id: this.id,
      ref_file_id: this.ref_file_id,
      loan_id: this.loan_id,
      customer_id: this.customer_id,
      file_name: this.file_name,
      file_path: this.file_path,
      doc_type: this.doc_type,
      file_type: this.file_type,
      developer_code: this.developer_code,
      rem_file_id: this.rem_file_id,
      rem_link_url: this.rem_link_url,
      status: this.status,
      error_message: this.error_message,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Transaction_Document.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ITransaction_Document): Promise<Transaction_Document[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Transaction_Document(item));
  }

  static async findOne(request: Request, condition: ITransaction_Document): Promise<Transaction_Document> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Transaction_Document(item);
  }

  static async count(request: Request, condition: ITransaction_Document): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ITransaction_Document): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ITransaction_Document, condition: ITransaction_Document): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ITransaction_Document): Promise<void> {
      return this.builder.delete(request, condition);
  }
}