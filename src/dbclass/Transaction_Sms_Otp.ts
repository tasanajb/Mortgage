import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ITransaction_Sms_OtpMethod {
  load(request: Request, id: number | ITransaction_Sms_Otp): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ITransaction_Sms_Otp): void;
  insert(request: Request): Promise<string | number>;
}

export interface ITransaction_Sms_Otp {
    id?: number;
    line_id?: string;
    citizen_id?: string;
    mobile_number?: string;
    token?: string;
    pin_code?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;
    expied_date?: Date;
}

export class Transaction_Sms_Otp implements ITransaction_Sms_Otp, ITransaction_Sms_OtpMethod {
    id?: number;
    line_id?: string;
    citizen_id?: string;
    mobile_number?: string;
    token?: string;
    pin_code?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;
    expied_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Transaction_Sms_Otp",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    line_id: { name: "LineId", type: sql.NVarChar, is_identity: false, is_primary: false },
    citizen_id: { name: "CitizenId", type: sql.NVarChar, is_identity: false, is_primary: false },
    mobile_number: { name: "MobileNumber", type: sql.NVarChar, is_identity: false, is_primary: false },
    token: { name: "Token", type: sql.NVarChar, is_identity: false, is_primary: false },
    pin_code: { name: "PinCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    expied_date: { name: "ExpiedDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","line_id","citizen_id","mobile_number","token","pin_code","status","create_date","update_date","expied_date"]
  );

  constructor(request?: Request | ITransaction_Sms_Otp, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ITransaction_Sms_Otp);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Transaction_Sms_Otp.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ITransaction_Sms_Otp): void {
    this.id = data.id;
    this.line_id = data.line_id;
    this.citizen_id = data.citizen_id;
    this.mobile_number = data.mobile_number;
    this.token = data.token;
    this.pin_code = data.pin_code;
    this.status = data.status;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
    this.expied_date = data.expied_date;
  }

  insert(request: Request): Promise<string | number> {
    return Transaction_Sms_Otp.insert(request, {
      id: this.id,
      line_id: this.line_id,
      citizen_id: this.citizen_id,
      mobile_number: this.mobile_number,
      token: this.token,
      pin_code: this.pin_code,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
      expied_date: this.expied_date,
    });
  }

  update(request: Request): Promise<void> {
    return Transaction_Sms_Otp.update(request, {
      id: this.id,
      line_id: this.line_id,
      citizen_id: this.citizen_id,
      mobile_number: this.mobile_number,
      token: this.token,
      pin_code: this.pin_code,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
      expied_date: this.expied_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Transaction_Sms_Otp.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ITransaction_Sms_Otp): Promise<Transaction_Sms_Otp[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Transaction_Sms_Otp(item));
  }

  static async findOne(request: Request, condition: ITransaction_Sms_Otp): Promise<Transaction_Sms_Otp> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Transaction_Sms_Otp(item);
  }

  static async count(request: Request, condition: ITransaction_Sms_Otp): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ITransaction_Sms_Otp): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ITransaction_Sms_Otp, condition: ITransaction_Sms_Otp): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ITransaction_Sms_Otp): Promise<void> {
      return this.builder.delete(request, condition);
  }
}