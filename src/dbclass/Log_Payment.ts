import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ILog_PaymentMethod {
  load(request: Request, id: number | ILog_Payment): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ILog_Payment): void;
  insert(request: Request): Promise<string | number>;
}

export interface ILog_Payment {
    id?: number;
    value?: string;
    payment_method?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Log_Payment implements ILog_Payment, ILog_PaymentMethod {
    id?: number;
    value?: string;
    payment_method?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Log_Payment",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    value: { name: "Value", type: sql.Text, is_identity: false, is_primary: false },
    payment_method: { name: "Payment_Method", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","value","payment_method","status","create_date","update_date"]
  );

  constructor(request?: Request | ILog_Payment, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ILog_Payment);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Log_Payment.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ILog_Payment): void {
    this.id = data.id;
    this.value = data.value;
    this.payment_method = data.payment_method;
    this.status = data.status;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Log_Payment.insert(request, {
      id: this.id,
      value: this.value,
      payment_method: this.payment_method,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Log_Payment.update(request, {
      id: this.id,
      value: this.value,
      payment_method: this.payment_method,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Log_Payment.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ILog_Payment): Promise<Log_Payment[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Log_Payment(item));
  }

  static async findOne(request: Request, condition: ILog_Payment): Promise<Log_Payment> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Log_Payment(item);
  }

  static async count(request: Request, condition: ILog_Payment): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ILog_Payment): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ILog_Payment, condition: ILog_Payment): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ILog_Payment): Promise<void> {
      return this.builder.delete(request, condition);
  }
}