import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_ProvinceMethod {
  load(request: Request, id: string | IMaster_Province): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: string): Promise<void>;
  loadByData(data: IMaster_Province): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Province {
    id?: number;
    province_id?: string;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Province implements IMaster_Province, IMaster_ProvinceMethod {
    id?: number;
    province_id?: string;
    name_th?: string;
    name_eng?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Province",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: false },
    province_id: { name: "ProvinceId", type: sql.NVarChar, is_identity: false, is_primary: true },
    name_th: { name: "NameTh", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","province_id","name_th","name_eng","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Province, province_id?: string) {
    if (province_id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, province_id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("province_id is required.");
      }
      this.loadByData(request as IMaster_Province);
    }
  }

  async load(request: Request, province_id: string): Promise<void> {
      const item = await Master_Province.findOne(request, { province_id: province_id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Province): void {
    this.id = data.id;
    this.province_id = data.province_id;
    this.name_th = data.name_th;
    this.name_eng = data.name_eng;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Province.insert(request, {
      id: this.id,
      province_id: this.province_id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Province.update(request, {
      id: this.id,
      province_id: this.province_id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      province_id: this.province_id
    });
  }

  delete(request: Request, province_id: string): Promise<void> {
    return Master_Province.delete(request, {
      province_id: province_id
    });
  }

  static async find(request: Request, condition: IMaster_Province): Promise<Master_Province[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Province(item));
  }

  static async findOne(request: Request, condition: IMaster_Province): Promise<Master_Province> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Province(item);
  }

  static async count(request: Request, condition: IMaster_Province): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Province): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Province, condition: IMaster_Province): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Province): Promise<void> {
      return this.builder.delete(request, condition);
  }
}