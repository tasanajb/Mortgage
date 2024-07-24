import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_UnitMethod {
  load(request: Request, id: number | IMaster_Unit): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Unit): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Unit {
    id?: number;
    unit_id?: string;
    unit_no?: string;
    unit_type?: string;
    unit_type_name?: string;
    collateral_price?: number;
    title_deed_no?: string;
    floor_no?: string;
    zone_no?: string;
    building_no?: string;
    model_name?: string;
    project_code?: string;
    project_name?: string;
    developer_code?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Unit implements IMaster_Unit, IMaster_UnitMethod {
    id?: number;
    unit_id?: string;
    unit_no?: string;
    unit_type?: string;
    unit_type_name?: string;
    collateral_price?: number;
    title_deed_no?: string;
    floor_no?: string;
    zone_no?: string;
    building_no?: string;
    model_name?: string;
    project_code?: string;
    project_name?: string;
    developer_code?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Unit",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    unit_id: { name: "UnitId", type: sql.NVarChar, is_identity: false, is_primary: true },
    unit_no: { name: "UnitNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    unit_type: { name: "UnitType", type: sql.NVarChar, is_identity: false, is_primary: false },
    unit_type_name: { name: "UnitTypeName", type: sql.NVarChar, is_identity: false, is_primary: false },
    collateral_price: { name: "CollateralPrice", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    title_deed_no: { name: "TitleDeedNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    floor_no: { name: "FloorNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    zone_no: { name: "ZoneNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    building_no: { name: "BuildingNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    model_name: { name: "ModelName", type: sql.NVarChar, is_identity: false, is_primary: false },
    project_code: { name: "ProjectCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    project_name: { name: "ProjectName", type: sql.NVarChar, is_identity: false, is_primary: false },
    developer_code: { name: "DeveloperCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","unit_id","unit_no","unit_type","unit_type_name","collateral_price","title_deed_no","floor_no","zone_no","building_no","model_name","project_code","project_name","developer_code","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Unit, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Unit);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Unit.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Unit): void {
    this.id = data.id;
    this.unit_id = data.unit_id;
    this.unit_no = data.unit_no;
    this.unit_type = data.unit_type;
    this.unit_type_name = data.unit_type_name;
    this.collateral_price = data.collateral_price;
    this.title_deed_no = data.title_deed_no;
    this.floor_no = data.floor_no;
    this.zone_no = data.zone_no;
    this.building_no = data.building_no;
    this.model_name = data.model_name;
    this.project_code = data.project_code;
    this.project_name = data.project_name;
    this.developer_code = data.developer_code;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Unit.insert(request, {
      id: this.id,
      unit_id: this.unit_id,
      unit_no: this.unit_no,
      unit_type: this.unit_type,
      unit_type_name: this.unit_type_name,
      collateral_price: this.collateral_price,
      title_deed_no: this.title_deed_no,
      floor_no: this.floor_no,
      zone_no: this.zone_no,
      building_no: this.building_no,
      model_name: this.model_name,
      project_code: this.project_code,
      project_name: this.project_name,
      developer_code: this.developer_code,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Unit.update(request, {
      id: this.id,
      unit_id: this.unit_id,
      unit_no: this.unit_no,
      unit_type: this.unit_type,
      unit_type_name: this.unit_type_name,
      collateral_price: this.collateral_price,
      title_deed_no: this.title_deed_no,
      floor_no: this.floor_no,
      zone_no: this.zone_no,
      building_no: this.building_no,
      model_name: this.model_name,
      project_code: this.project_code,
      project_name: this.project_name,
      developer_code: this.developer_code,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Unit.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Unit): Promise<Master_Unit[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Unit(item));
  }

  static async findOne(request: Request, condition: IMaster_Unit): Promise<Master_Unit> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Unit(item);
  }

  static async count(request: Request, condition: IMaster_Unit): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Unit): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Unit, condition: IMaster_Unit): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Unit): Promise<void> {
      return this.builder.delete(request, condition);
  }
}