import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ITransaction_Notification_LineMethod {
  load(request: Request, id: number | ITransaction_Notification_Line): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ITransaction_Notification_Line): void;
  insert(request: Request): Promise<string | number>;
}

export interface ITransaction_Notification_Line {
    id?: number;
    send_to?: string;
    customer_id?: string;
    subject?: string;
    body?: string;
    create_date?: Date;
    effective_date?: Date;
    sent_date?: Date;
    error_date?: Date;
    error_message?: string;
    error_count?: number;
    status?: string;
    message_type?: string;
}

export class Transaction_Notification_Line implements ITransaction_Notification_Line, ITransaction_Notification_LineMethod {
    id?: number;
    send_to?: string;
    customer_id?: string;
    subject?: string;
    body?: string;
    create_date?: Date;
    effective_date?: Date;
    sent_date?: Date;
    error_date?: Date;
    error_message?: string;
    error_count?: number;
    status?: string;
    message_type?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Transaction_Notification_Line",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    send_to: { name: "SendTo", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    subject: { name: "Subject", type: sql.NVarChar, is_identity: false, is_primary: false },
    body: { name: "Body", type: sql.NText, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    effective_date: { name: "EffectiveDate", type: sql.DateTime, is_identity: false, is_primary: false },
    sent_date: { name: "SentDate", type: sql.DateTime, is_identity: false, is_primary: false },
    error_date: { name: "ErrorDate", type: sql.DateTime, is_identity: false, is_primary: false },
    error_message: { name: "ErrorMessage", type: sql.NVarChar, is_identity: false, is_primary: false },
    error_count: { name: "ErrorCount", type: sql.Int, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    message_type: { name: "MessageType", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","send_to","customer_id","subject","body","create_date","effective_date","sent_date","error_date","error_message","error_count","status","message_type"]
  );

  constructor(request?: Request | ITransaction_Notification_Line, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ITransaction_Notification_Line);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Transaction_Notification_Line.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ITransaction_Notification_Line): void {
    this.id = data.id;
    this.send_to = data.send_to;
    this.customer_id = data.customer_id;
    this.subject = data.subject;
    this.body = data.body;
    this.create_date = data.create_date;
    this.effective_date = data.effective_date;
    this.sent_date = data.sent_date;
    this.error_date = data.error_date;
    this.error_message = data.error_message;
    this.error_count = data.error_count;
    this.status = data.status;
    this.message_type = data.message_type;
  }

  insert(request: Request): Promise<string | number> {
    return Transaction_Notification_Line.insert(request, {
      id: this.id,
      send_to: this.send_to,
      customer_id: this.customer_id,
      subject: this.subject,
      body: this.body,
      create_date: this.create_date,
      effective_date: this.effective_date,
      sent_date: this.sent_date,
      error_date: this.error_date,
      error_message: this.error_message,
      error_count: this.error_count,
      status: this.status,
      message_type: this.message_type,
    });
  }

  update(request: Request): Promise<void> {
    return Transaction_Notification_Line.update(request, {
      id: this.id,
      send_to: this.send_to,
      customer_id: this.customer_id,
      subject: this.subject,
      body: this.body,
      create_date: this.create_date,
      effective_date: this.effective_date,
      sent_date: this.sent_date,
      error_date: this.error_date,
      error_message: this.error_message,
      error_count: this.error_count,
      status: this.status,
      message_type: this.message_type,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Transaction_Notification_Line.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ITransaction_Notification_Line): Promise<Transaction_Notification_Line[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Transaction_Notification_Line(item));
  }

  static async findOne(request: Request, condition: ITransaction_Notification_Line): Promise<Transaction_Notification_Line> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Transaction_Notification_Line(item);
  }

  static async count(request: Request, condition: ITransaction_Notification_Line): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ITransaction_Notification_Line): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ITransaction_Notification_Line, condition: ITransaction_Notification_Line): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ITransaction_Notification_Line): Promise<void> {
      return this.builder.delete(request, condition);
  }
}