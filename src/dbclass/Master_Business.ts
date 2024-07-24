import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_BusinessMethod {
  load(request: Request, id: number | IMaster_Business): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Business): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Business {
    id?: number;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;
    rem_code?: string;
}

export class Master_Business implements IMaster_Business, IMaster_BusinessMethod {
    id?: number;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;
    rem_code?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Business",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    name_th: { name: "NameTh", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    rem_code: { name: "RemCode", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","name_th","name_eng","create_date","update_date","rem_code"]
  );

  constructor(request?: Request | IMaster_Business, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Business);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Business.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Business): void {
    this.id = data.id;
    this.name_th = data.name_th;
    this.name_eng = data.name_eng;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
    this.rem_code = data.rem_code;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Business.insert(request, {
      id: this.id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      create_date: this.create_date,
      update_date: this.update_date,
      rem_code: this.rem_code,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Business.update(request, {
      id: this.id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      create_date: this.create_date,
      update_date: this.update_date,
      rem_code: this.rem_code,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Business.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Business): Promise<Master_Business[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Business(item));
  }

  static async findOne(request: Request, condition: IMaster_Business): Promise<Master_Business> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Business(item);
  }

  static async count(request: Request, condition: IMaster_Business): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Business): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Business, condition: IMaster_Business): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Business): Promise<void> {
      return this.builder.delete(request, condition);
  }
}