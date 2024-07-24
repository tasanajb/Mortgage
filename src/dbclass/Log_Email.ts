import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ILog_EmailMethod {
  load(request: Request, id: number | ILog_Email): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ILog_Email): void;
  insert(request: Request): Promise<string | number>;
}

export interface ILog_Email {
    id?: number;
    create_date?: Date;
    update_date?: Date;
}

export class Log_Email implements ILog_Email, ILog_EmailMethod {
    id?: number;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Log_Email",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","create_date","update_date"]
  );

  constructor(request?: Request | ILog_Email, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ILog_Email);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Log_Email.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ILog_Email): void {
    this.id = data.id;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Log_Email.insert(request, {
      id: this.id,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Log_Email.update(request, {
      id: this.id,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Log_Email.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ILog_Email): Promise<Log_Email[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Log_Email(item));
  }

  static async findOne(request: Request, condition: ILog_Email): Promise<Log_Email> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Log_Email(item);
  }

  static async count(request: Request, condition: ILog_Email): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ILog_Email): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ILog_Email, condition: ILog_Email): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ILog_Email): Promise<void> {
      return this.builder.delete(request, condition);
  }
}