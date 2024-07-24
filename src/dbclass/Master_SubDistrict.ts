import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_SubDistrictMethod {
  load(request: Request, id: string | IMaster_SubDistrict): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: string): Promise<void>;
  loadByData(data: IMaster_SubDistrict): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_SubDistrict {
    id?: number;
    sub_district_id?: string;
    name_th?: string;
    name_eng?: string;
    province_id?: string;
    district_id?: string;
    post_code?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_SubDistrict implements IMaster_SubDistrict, IMaster_SubDistrictMethod {
    id?: number;
    sub_district_id?: string;
    name_th?: string;
    name_eng?: string;
    province_id?: string;
    district_id?: string;
    post_code?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_SubDistrict",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: false },
    sub_district_id: { name: "SubDistrictId", type: sql.NVarChar, is_identity: false, is_primary: true },
    name_th: { name: "NameTh", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    province_id: { name: "ProvinceId", type: sql.NVarChar, is_identity: false, is_primary: false },
    district_id: { name: "DistrictId", type: sql.NVarChar, is_identity: false, is_primary: false },
    post_code: { name: "PostCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","sub_district_id","name_th","name_eng","province_id","district_id","post_code","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_SubDistrict, sub_district_id?: string) {
    if (sub_district_id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, sub_district_id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("sub_district_id is required.");
      }
      this.loadByData(request as IMaster_SubDistrict);
    }
  }

  async load(request: Request, sub_district_id: string): Promise<void> {
      const item = await Master_SubDistrict.findOne(request, { sub_district_id: sub_district_id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_SubDistrict): void {
    this.id = data.id;
    this.sub_district_id = data.sub_district_id;
    this.name_th = data.name_th;
    this.name_eng = data.name_eng;
    this.province_id = data.province_id;
    this.district_id = data.district_id;
    this.post_code = data.post_code;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_SubDistrict.insert(request, {
      id: this.id,
      sub_district_id: this.sub_district_id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      province_id: this.province_id,
      district_id: this.district_id,
      post_code: this.post_code,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_SubDistrict.update(request, {
      id: this.id,
      sub_district_id: this.sub_district_id,
      name_th: this.name_th,
      name_eng: this.name_eng,
      province_id: this.province_id,
      district_id: this.district_id,
      post_code: this.post_code,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      sub_district_id: this.sub_district_id
    });
  }

  delete(request: Request, sub_district_id: string): Promise<void> {
    return Master_SubDistrict.delete(request, {
      sub_district_id: sub_district_id
    });
  }

  static async find(request: Request, condition: IMaster_SubDistrict): Promise<Master_SubDistrict[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_SubDistrict(item));
  }

  static async findOne(request: Request, condition: IMaster_SubDistrict): Promise<Master_SubDistrict> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_SubDistrict(item);
  }

  static async count(request: Request, condition: IMaster_SubDistrict): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_SubDistrict): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_SubDistrict, condition: IMaster_SubDistrict): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_SubDistrict): Promise<void> {
      return this.builder.delete(request, condition);
  }
}