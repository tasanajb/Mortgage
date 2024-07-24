import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_Married_StatusMethod {
  load(request: Request, id: number | IMaster_Married_Status): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Married_Status): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Married_Status {
    id?: number;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Married_Status implements IMaster_Married_Status, IMaster_Married_StatusMethod {
    id?: number;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Married_Status",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    name_th: { name: "NameTh", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","name_th","name_eng","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Married_Status, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Married_Status);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Married_Status.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Married_Status): void {
    this.id = data.id;
    this.name_th = data.name_th;
    this.name_eng = data.name_eng;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Married_Status.insert(request, {
      id: this.id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Married_Status.update(request, {
      id: this.id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Married_Status.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Married_Status): Promise<Master_Married_Status[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Married_Status(item));
  }

  static async findOne(request: Request, condition: IMaster_Married_Status): Promise<Master_Married_Status> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Married_Status(item);
  }

  static async count(request: Request, condition: IMaster_Married_Status): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Married_Status): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Married_Status, condition: IMaster_Married_Status): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Married_Status): Promise<void> {
      return this.builder.delete(request, condition);
  }
}