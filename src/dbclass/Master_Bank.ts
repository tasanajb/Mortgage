import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_BankMethod {
  load(request: Request, id: number | IMaster_Bank): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Bank): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Bank {
    id?: number;
    bank_code?: string;
    name?: string;
    name_eng?: string;
    bank_logo?: string;
    status?: string;
}

export class Master_Bank implements IMaster_Bank, IMaster_BankMethod {
    id?: number;
    bank_code?: string;
    name?: string;
    name_eng?: string;
    bank_logo?: string;
    status?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Bank",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    bank_code: { name: "BankCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    name: { name: "Name", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    bank_logo: { name: "BankLogo", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","bank_code","name","name_eng","bank_logo","status"]
  );

  constructor(request?: Request | IMaster_Bank, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Bank);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Bank.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Bank): void {
    this.id = data.id;
    this.bank_code = data.bank_code;
    this.name = data.name;
    this.name_eng = data.name_eng;
    this.bank_logo = data.bank_logo;
    this.status = data.status;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Bank.insert(request, {
      id: this.id,
      bank_code: this.bank_code,
      name: this.name,
      name_eng: this.name_eng,
      bank_logo: this.bank_logo,
      status: this.status,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Bank.update(request, {
      id: this.id,
      bank_code: this.bank_code,
      name: this.name,
      name_eng: this.name_eng,
      bank_logo: this.bank_logo,
      status: this.status,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Bank.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Bank): Promise<Master_Bank[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Bank(item));
  }

  static async findOne(request: Request, condition: IMaster_Bank): Promise<Master_Bank> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Bank(item);
  }

  static async count(request: Request, condition: IMaster_Bank): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Bank): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Bank, condition: IMaster_Bank): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Bank): Promise<void> {
      return this.builder.delete(request, condition);
  }
}