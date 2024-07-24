import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_PrefixMethod {
  load(request: Request, id: number | IMaster_Prefix): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Prefix): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Prefix {
    id?: number;
    text?: string;
    full_text?: string;
    rem_code?: number;
    seq?: number;
    language?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Prefix implements IMaster_Prefix, IMaster_PrefixMethod {
    id?: number;
    text?: string;
    full_text?: string;
    rem_code?: number;
    seq?: number;
    language?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Prefix",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    text: { name: "Text", type: sql.NVarChar, is_identity: false, is_primary: false },
    full_text: { name: "FullText", type: sql.NVarChar, is_identity: false, is_primary: false },
    rem_code: { name: "RemCode", type: sql.Int, is_identity: false, is_primary: false },
    seq: { name: "Seq", type: sql.Int, is_identity: false, is_primary: false },
    language: { name: "Language", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","text","full_text","rem_code","seq","language","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Prefix, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Prefix);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Prefix.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Prefix): void {
    this.id = data.id;
    this.text = data.text;
    this.full_text = data.full_text;
    this.rem_code = data.rem_code;
    this.seq = data.seq;
    this.language = data.language;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Prefix.insert(request, {
      id: this.id,
      text: this.text,
      full_text: this.full_text,
      rem_code: this.rem_code,
      seq: this.seq,
      language: this.language,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Prefix.update(request, {
      id: this.id,
      text: this.text,
      full_text: this.full_text,
      rem_code: this.rem_code,
      seq: this.seq,
      language: this.language,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Prefix.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Prefix): Promise<Master_Prefix[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Prefix(item));
  }

  static async findOne(request: Request, condition: IMaster_Prefix): Promise<Master_Prefix> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null : new Master_Prefix(item);
  }

  static insert(request: Request, params: IMaster_Prefix): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Prefix, condition: IMaster_Prefix): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Prefix): Promise<void> {
      return this.builder.delete(request, condition);
  }
}