import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMapping_Customer_UnitMethod {
  load(request: Request, id: number | IMapping_Customer_Unit): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMapping_Customer_Unit): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMapping_Customer_Unit {
    id?: number;
    unit_id?: string;
    customer_id?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Mapping_Customer_Unit implements IMapping_Customer_Unit, IMapping_Customer_UnitMethod {
    id?: number;
    unit_id?: string;
    customer_id?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Mapping_Customer_Unit",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    unit_id: { name: "UnitId", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","unit_id","customer_id","create_date","update_date"]
  );

  constructor(request?: Request | IMapping_Customer_Unit, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMapping_Customer_Unit);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Mapping_Customer_Unit.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMapping_Customer_Unit): void {
    this.id = data.id;
    this.unit_id = data.unit_id;
    this.customer_id = data.customer_id;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Mapping_Customer_Unit.insert(request, {
      id: this.id,
      unit_id: this.unit_id,
      customer_id: this.customer_id,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Mapping_Customer_Unit.update(request, {
      id: this.id,
      unit_id: this.unit_id,
      customer_id: this.customer_id,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Mapping_Customer_Unit.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMapping_Customer_Unit): Promise<Mapping_Customer_Unit[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Mapping_Customer_Unit(item));
  }

  static async findOne(request: Request, condition: IMapping_Customer_Unit): Promise<Mapping_Customer_Unit> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Mapping_Customer_Unit(item);
  }

  static async count(request: Request, condition: IMapping_Customer_Unit): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMapping_Customer_Unit): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMapping_Customer_Unit, condition: IMapping_Customer_Unit): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMapping_Customer_Unit): Promise<void> {
      return this.builder.delete(request, condition);
  }
}