import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMapping_Customer_RegisterMethod {
  load(request: Request, id: number | IMapping_Customer_Register): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMapping_Customer_Register): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMapping_Customer_Register {
    id?: number;
    line_id?: string;
    line_name?: string;
    customer_id?: string;
    pin?: string;
    status?: string;
    is_accept?: boolean;
    count_wrong_pin?: number;
    expied_date_blocked_pin?: Date;
    blocked_minutes?: number;
    create_date?: Date;
    update_date?: Date;
}

export class Mapping_Customer_Register implements IMapping_Customer_Register, IMapping_Customer_RegisterMethod {
    id?: number;
    line_id?: string;
    line_name?: string;
    customer_id?: string;
    pin?: string;
    status?: string;
    is_accept?: boolean;
    count_wrong_pin?: number;
    expied_date_blocked_pin?: Date;
    blocked_minutes?: number;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Mapping_Customer_Register",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    line_id: { name: "LineId", type: sql.NVarChar, is_identity: false, is_primary: true },
    line_name: { name: "LineName", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    pin: { name: "Pin", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    is_accept: { name: "IsAccept", type: sql.Bit, is_identity: false, is_primary: false },
    count_wrong_pin: { name: "CountWrongPin", type: sql.Int, is_identity: false, is_primary: false },
    expied_date_blocked_pin: { name: "ExpiedDateBlockedPin", type: sql.DateTime, is_identity: false, is_primary: false },
    blocked_minutes: { name: "BlockedMinutes", type: sql.Int, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","line_id","line_name","customer_id","pin","status","is_accept","count_wrong_pin","expied_date_blocked_pin","blocked_minutes","create_date","update_date"]
  );

  constructor(request?: Request | IMapping_Customer_Register, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMapping_Customer_Register);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Mapping_Customer_Register.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMapping_Customer_Register): void {
    this.id = data.id;
    this.line_id = data.line_id;
    this.line_name = data.line_name;
    this.customer_id = data.customer_id;
    this.pin = data.pin;
    this.status = data.status;
    this.is_accept = data.is_accept;
    this.count_wrong_pin = data.count_wrong_pin;
    this.expied_date_blocked_pin = data.expied_date_blocked_pin;
    this.blocked_minutes = data.blocked_minutes;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Mapping_Customer_Register.insert(request, {
      id: this.id,
      line_id: this.line_id,
      line_name: this.line_name,
      customer_id: this.customer_id,
      pin: this.pin,
      status: this.status,
      is_accept: this.is_accept,
      count_wrong_pin: this.count_wrong_pin,
      expied_date_blocked_pin: this.expied_date_blocked_pin,
      blocked_minutes: this.blocked_minutes,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Mapping_Customer_Register.update(request, {
      id: this.id,
      line_id: this.line_id,
      line_name: this.line_name,
      customer_id: this.customer_id,
      pin: this.pin,
      status: this.status,
      is_accept: this.is_accept,
      count_wrong_pin: this.count_wrong_pin,
      expied_date_blocked_pin: this.expied_date_blocked_pin,
      blocked_minutes: this.blocked_minutes,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Mapping_Customer_Register.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMapping_Customer_Register): Promise<Mapping_Customer_Register[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Mapping_Customer_Register(item));
  }

  static async findOne(request: Request, condition: IMapping_Customer_Register): Promise<Mapping_Customer_Register> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Mapping_Customer_Register(item);
  }

  static async count(request: Request, condition: IMapping_Customer_Register): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMapping_Customer_Register): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMapping_Customer_Register, condition: IMapping_Customer_Register): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMapping_Customer_Register): Promise<void> {
      return this.builder.delete(request, condition);
  }
}