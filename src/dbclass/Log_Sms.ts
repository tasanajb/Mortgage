import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ILog_SmsMethod {
  load(request: Request, id: number | ILog_Sms): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ILog_Sms): void;
  insert(request: Request): Promise<string | number>;
}

export interface ILog_Sms {
    id?: number;
    type?: string;
    body?: string;
    error_message?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Log_Sms implements ILog_Sms, ILog_SmsMethod {
    id?: number;
    type?: string;
    body?: string;
    error_message?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Log_Sms",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    type: { name: "Type", type: sql.NVarChar, is_identity: false, is_primary: false },
    body: { name: "Body", type: sql.NVarChar, is_identity: false, is_primary: false },
    error_message: { name: "ErrorMessage", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","type","body","error_message","create_date","update_date"]
  );

  constructor(request?: Request | ILog_Sms, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ILog_Sms);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Log_Sms.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ILog_Sms): void {
    this.id = data.id;
    this.type = data.type;
    this.body = data.body;
    this.error_message = data.error_message;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Log_Sms.insert(request, {
      id: this.id,
      type: this.type,
      body: this.body,
      error_message: this.error_message,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Log_Sms.update(request, {
      id: this.id,
      type: this.type,
      body: this.body,
      error_message: this.error_message,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Log_Sms.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ILog_Sms): Promise<Log_Sms[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Log_Sms(item));
  }

  static async findOne(request: Request, condition: ILog_Sms): Promise<Log_Sms> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Log_Sms(item);
  }

  static async count(request: Request, condition: ILog_Sms): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ILog_Sms): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ILog_Sms, condition: ILog_Sms): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ILog_Sms): Promise<void> {
      return this.builder.delete(request, condition);
  }
}