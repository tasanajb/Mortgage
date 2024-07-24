import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_Ncb_StatusMethod {
  load(request: Request, id: number | IMaster_Ncb_Status): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Ncb_Status): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Ncb_Status {
    id?: number;
    ncb_status_code?: string;
    name?: string;
    name_eng?: string;
    discription?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Ncb_Status implements IMaster_Ncb_Status, IMaster_Ncb_StatusMethod {
    id?: number;
    ncb_status_code?: string;
    name?: string;
    name_eng?: string;
    discription?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Ncb_Status",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    ncb_status_code: { name: "NcbStatusCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    name: { name: "Name", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    discription: { name: "Discription", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","ncb_status_code","name","name_eng","discription","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Ncb_Status, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Ncb_Status);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Ncb_Status.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Ncb_Status): void {
    this.id = data.id;
    this.ncb_status_code = data.ncb_status_code;
    this.name = data.name;
    this.name_eng = data.name_eng;
    this.discription = data.discription;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Ncb_Status.insert(request, {
      id: this.id,
      ncb_status_code: this.ncb_status_code,
      name: this.name,
      name_eng: this.name_eng,
      discription: this.discription,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Ncb_Status.update(request, {
      id: this.id,
      ncb_status_code: this.ncb_status_code,
      name: this.name,
      name_eng: this.name_eng,
      discription: this.discription,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Ncb_Status.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Ncb_Status): Promise<Master_Ncb_Status[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Ncb_Status(item));
  }

  static async findOne(request: Request, condition: IMaster_Ncb_Status): Promise<Master_Ncb_Status> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Ncb_Status(item);
  }

  static async count(request: Request, condition: IMaster_Ncb_Status): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Ncb_Status): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Ncb_Status, condition: IMaster_Ncb_Status): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Ncb_Status): Promise<void> {
      return this.builder.delete(request, condition);
  }
}