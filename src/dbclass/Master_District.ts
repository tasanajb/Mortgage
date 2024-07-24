import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_DistrictMethod {
  load(request: Request, id: string | IMaster_District): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: string): Promise<void>;
  loadByData(data: IMaster_District): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_District {
    id?: number;
    district_id?: string;
    name_th?: string;
    name_eng?: string;
    province_id?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_District implements IMaster_District, IMaster_DistrictMethod {
    id?: number;
    district_id?: string;
    name_th?: string;
    name_eng?: string;
    province_id?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_District",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: false },
    district_id: { name: "DistrictId", type: sql.NVarChar, is_identity: false, is_primary: true },
    name_th: { name: "NameTh", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    province_id: { name: "ProvinceId", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","district_id","name_th","name_eng","province_id","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_District, district_id?: string) {
    if (district_id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, district_id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("district_id is required.");
      }
      this.loadByData(request as IMaster_District);
    }
  }

  async load(request: Request, district_id: string): Promise<void> {
      const item = await Master_District.findOne(request, { district_id: district_id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_District): void {
    this.id = data.id;
    this.district_id = data.district_id;
    this.name_th = data.name_th;
    this.name_eng = data.name_eng;
    this.province_id = data.province_id;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_District.insert(request, {
      id: this.id,
      district_id: this.district_id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      province_id: this.province_id,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_District.update(request, {
      id: this.id,
      district_id: this.district_id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      province_id: this.province_id,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      district_id: this.district_id
    });
  }

  delete(request: Request, district_id: string): Promise<void> {
    return Master_District.delete(request, {
      district_id: district_id
    });
  }

  static async find(request: Request, condition: IMaster_District): Promise<Master_District[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_District(item));
  }

  static async findOne(request: Request, condition: IMaster_District): Promise<Master_District> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null : new Master_District(item);
  }

  static insert(request: Request, params: IMaster_District): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_District, condition: IMaster_District): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_District): Promise<void> {
      return this.builder.delete(request, condition);
  }
}