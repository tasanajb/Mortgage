import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ISys_Config_RunNumberMethod {
  load(request: Request, id: number | ISys_Config_RunNumber): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ISys_Config_RunNumber): void;
  insert(request: Request): Promise<string | number>;
}

export interface ISys_Config_RunNumber {
    id?: number;
    run_key?: number;
    key_code?: string;
    run_year?: number;
    run_month?: number;
    run_number?: number;
    document_format?: string;
}

export class Sys_Config_RunNumber implements ISys_Config_RunNumber, ISys_Config_RunNumberMethod {
    id?: number;
    run_key?: number;
    key_code?: string;
    run_year?: number;
    run_month?: number;
    run_number?: number;
    document_format?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Sys_Config_RunNumber",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    run_key: { name: "RunKey", type: sql.Int, is_identity: false, is_primary: true },
    key_code: { name: "KeyCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    run_year: { name: "RunYear", type: sql.Int, is_identity: false, is_primary: false },
    run_month: { name: "RunMonth", type: sql.Int, is_identity: false, is_primary: false },
    run_number: { name: "RunNumber", type: sql.Int, is_identity: false, is_primary: false },
    document_format: { name: "DocumentFormat", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","run_key","key_code","run_year","run_month","run_number","document_format"]
  );

  constructor(request?: Request | ISys_Config_RunNumber, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ISys_Config_RunNumber);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Sys_Config_RunNumber.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ISys_Config_RunNumber): void {
    this.id = data.id;
    this.run_key = data.run_key;
    this.key_code = data.key_code;
    this.run_year = data.run_year;
    this.run_month = data.run_month;
    this.run_number = data.run_number;
    this.document_format = data.document_format;
  }

  insert(request: Request): Promise<string | number> {
    return Sys_Config_RunNumber.insert(request, {
      id: this.id,
      run_key: this.run_key,
      key_code: this.key_code,
      run_year: this.run_year,
      run_month: this.run_month,
      run_number: this.run_number,
      document_format: this.document_format,
    });
  }

  update(request: Request): Promise<void> {
    return Sys_Config_RunNumber.update(request, {
      id: this.id,
      run_key: this.run_key,
      key_code: this.key_code,
      run_year: this.run_year,
      run_month: this.run_month,
      run_number: this.run_number,
      document_format: this.document_format,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Sys_Config_RunNumber.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ISys_Config_RunNumber): Promise<Sys_Config_RunNumber[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Sys_Config_RunNumber(item));
  }

  static async findOne(request: Request, condition: ISys_Config_RunNumber): Promise<Sys_Config_RunNumber> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null : new Sys_Config_RunNumber(item);
  }

  static insert(request: Request, params: ISys_Config_RunNumber): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ISys_Config_RunNumber, condition: ISys_Config_RunNumber): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ISys_Config_RunNumber): Promise<void> {
      return this.builder.delete(request, condition);
  }
}