import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ILog_ApiMethod {
  load(request: Request, id: string | ILog_Api): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: string): Promise<void>;
  loadByData(data: ILog_Api): void;
  insert(request: Request): Promise<string | number>;
}

export interface ILog_Api {
    id?: string;
    type?: string;
    method?: string;
    origin?: string;
    header?: string;
    body?: string;
    response?: string;
    create_date?: Date;
    update_date?: Date;
    error_message?: string;
}

export class Log_Api implements ILog_Api, ILog_ApiMethod {
    id?: string;
    type?: string;
    method?: string;
    origin?: string;
    header?: string;
    body?: string;
    response?: string;
    create_date?: Date;
    update_date?: Date;
    error_message?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Log_Api",
    {
    id: { name: "Id", type: sql.NVarChar, is_identity: false, is_primary: true },
    type: { name: "Type", type: sql.NVarChar, is_identity: false, is_primary: false },
    method: { name: "Method", type: sql.NVarChar, is_identity: false, is_primary: false },
    origin: { name: "Origin", type: sql.NVarChar, is_identity: false, is_primary: false },
    header: { name: "Header", type: sql.NVarChar, is_identity: false, is_primary: false },
    body: { name: "Body", type: sql.NVarChar, is_identity: false, is_primary: false },
    response: { name: "Response", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    error_message: { name: "ErrorMessage", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    [],
    ["id","type","method","origin","header","body","response","create_date","update_date","error_message"]
  );

  constructor(request?: Request | ILog_Api, id?: string) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ILog_Api);
    }
  }

  async load(request: Request, id: string): Promise<void> {
      const item = await Log_Api.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ILog_Api): void {
    this.id = data.id;
    this.type = data.type;
    this.method = data.method;
    this.origin = data.origin;
    this.header = data.header;
    this.body = data.body;
    this.response = data.response;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
    this.error_message = data.error_message;
  }

  insert(request: Request): Promise<string | number> {
    return Log_Api.insert(request, {
      id: this.id,
      type: this.type,
      method: this.method,
      origin: this.origin,
      header: this.header,
      body: this.body,
      response: this.response,
      create_date: this.create_date,
      update_date: this.update_date,
      error_message: this.error_message,
    });
  }

  update(request: Request): Promise<void> {
    return Log_Api.update(request, {
      id: this.id,
      type: this.type,
      method: this.method,
      origin: this.origin,
      header: this.header,
      body: this.body,
      response: this.response,
      create_date: this.create_date,
      update_date: this.update_date,
      error_message: this.error_message,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: string): Promise<void> {
    return Log_Api.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ILog_Api): Promise<Log_Api[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Log_Api(item));
  }

  static async findOne(request: Request, condition: ILog_Api): Promise<Log_Api> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Log_Api(item);
  }

  static async count(request: Request, condition: ILog_Api): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ILog_Api): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ILog_Api, condition: ILog_Api): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ILog_Api): Promise<void> {
      return this.builder.delete(request, condition);
  }
}