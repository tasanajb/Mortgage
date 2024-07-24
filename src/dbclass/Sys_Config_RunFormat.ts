import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ISys_Config_RunFormatMethod {
  load(request: Request, id: number | ISys_Config_RunFormat): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ISys_Config_RunFormat): void;
  insert(request: Request): Promise<string | number>;
}

export interface ISys_Config_RunFormat {
    id?: number;
    run_key?: string;
    format?: string;
    caption?: string;
    field_name?: string;
    table_name?: string;
    is_continues?: string;
}

export class Sys_Config_RunFormat implements ISys_Config_RunFormat, ISys_Config_RunFormatMethod {
    id?: number;
    run_key?: string;
    format?: string;
    caption?: string;
    field_name?: string;
    table_name?: string;
    is_continues?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Sys_Config_RunFormat",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    run_key: { name: "RunKey", type: sql.NVarChar, is_identity: false, is_primary: false },
    format: { name: "Format", type: sql.NVarChar, is_identity: false, is_primary: false },
    caption: { name: "Caption", type: sql.NVarChar, is_identity: false, is_primary: false },
    field_name: { name: "FieldName", type: sql.NVarChar, is_identity: false, is_primary: false },
    table_name: { name: "TableName", type: sql.NVarChar, is_identity: false, is_primary: false },
    is_continues: { name: "IsContinues", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","run_key","format","caption","field_name","table_name","is_continues"]
  );

  constructor(request?: Request | ISys_Config_RunFormat, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ISys_Config_RunFormat);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Sys_Config_RunFormat.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ISys_Config_RunFormat): void {
    this.id = data.id;
    this.run_key = data.run_key;
    this.format = data.format;
    this.caption = data.caption;
    this.field_name = data.field_name;
    this.table_name = data.table_name;
    this.is_continues = data.is_continues;
  }

  insert(request: Request): Promise<string | number> {
    return Sys_Config_RunFormat.insert(request, {
      id: this.id,
      run_key: this.run_key,
      format: this.format,
      caption: this.caption,
      field_name: this.field_name,
      table_name: this.table_name,
      is_continues: this.is_continues,
    });
  }

  update(request: Request): Promise<void> {
    return Sys_Config_RunFormat.update(request, {
      id: this.id,
      run_key: this.run_key,
      format: this.format,
      caption: this.caption,
      field_name: this.field_name,
      table_name: this.table_name,
      is_continues: this.is_continues,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Sys_Config_RunFormat.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ISys_Config_RunFormat): Promise<Sys_Config_RunFormat[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Sys_Config_RunFormat(item));
  }

  static async findOne(request: Request, condition: ISys_Config_RunFormat): Promise<Sys_Config_RunFormat> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null : new Sys_Config_RunFormat(item);
  }

  static insert(request: Request, params: ISys_Config_RunFormat): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ISys_Config_RunFormat, condition: ISys_Config_RunFormat): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ISys_Config_RunFormat): Promise<void> {
      return this.builder.delete(request, condition);
  }
}