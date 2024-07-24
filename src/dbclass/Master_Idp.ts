import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_IdpMethod {
  load(request: Request, id: number | IMaster_Idp): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Idp): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Idp {
    id?: number;
    idp_id?: string;
    name?: string;
    name_eng?: string;
    idp_logo?: string;
    status?: string;
}

export class Master_Idp implements IMaster_Idp, IMaster_IdpMethod {
    id?: number;
    idp_id?: string;
    name?: string;
    name_eng?: string;
    idp_logo?: string;
    status?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Idp",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    idp_id: { name: "IdpId", type: sql.NVarChar, is_identity: false, is_primary: false },
    name: { name: "Name", type: sql.NVarChar, is_identity: false, is_primary: false },
    name_eng: { name: "NameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    idp_logo: { name: "IdpLogo", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","idp_id","name","name_eng","idp_logo","status"]
  );

  constructor(request?: Request | IMaster_Idp, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Idp);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Idp.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Idp): void {
    this.id = data.id;
    this.idp_id = data.idp_id;
    this.name = data.name;
    this.name_eng = data.name_eng;
    this.idp_logo = data.idp_logo;
    this.status = data.status;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Idp.insert(request, {
      id: this.id,
      idp_id: this.idp_id,
      name: this.name,
      name_eng: this.name_eng,
      idp_logo: this.idp_logo,
      status: this.status,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Idp.update(request, {
      id: this.id,
      idp_id: this.idp_id,
      name: this.name,
      name_eng: this.name_eng,
      idp_logo: this.idp_logo,
      status: this.status,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Idp.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Idp): Promise<Master_Idp[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Idp(item));
  }

  static async findOne(request: Request, condition: IMaster_Idp): Promise<Master_Idp> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any: new Master_Idp(item);
  }

  static async count(request: Request, condition: IMaster_Idp): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Idp): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Idp, condition: IMaster_Idp): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Idp): Promise<void> {
      return this.builder.delete(request, condition);
  }
}