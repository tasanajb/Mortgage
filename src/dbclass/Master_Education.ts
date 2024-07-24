import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_EducationMethod {
  load(request: Request, id: number | IMaster_Education): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Education): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Education {
    id?: number;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Education implements IMaster_Education, IMaster_EducationMethod {
    id?: number;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Education",
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

  constructor(request?: Request | IMaster_Education, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Education);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Education.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Education): void {
    this.id = data.id;
    this.name_th = data.name_th;
    this.name_eng = data.name_eng;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Education.insert(request, {
      id: this.id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Education.update(request, {
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
    return Master_Education.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Education): Promise<Master_Education[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Education(item));
  }

  static async findOne(request: Request, condition: IMaster_Education): Promise<Master_Education> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Education(item);
  }

  static async count(request: Request, condition: IMaster_Education): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Education): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Education, condition: IMaster_Education): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Education): Promise<void> {
      return this.builder.delete(request, condition);
  }
}