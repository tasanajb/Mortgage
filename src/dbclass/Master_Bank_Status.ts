import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_Bank_StatusMethod {
  load(request: Request, id: number | IMaster_Bank_Status): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Bank_Status): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Bank_Status {
    id?: number;
    code?: string;
    name?: string;
    group_id?: string;
}

export class Master_Bank_Status implements IMaster_Bank_Status, IMaster_Bank_StatusMethod {
    id?: number;
    code?: string;
    name?: string;
    group_id?: string;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Bank_Status",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    code: { name: "Code", type: sql.NVarChar, is_identity: false, is_primary: false },
    name: { name: "Name", type: sql.NVarChar, is_identity: false, is_primary: false },
    group_id: { name: "GroupId", type: sql.NVarChar, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","code","name","group_id"]
  );

  constructor(request?: Request | IMaster_Bank_Status, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Bank_Status);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Bank_Status.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Bank_Status): void {
    this.id = data.id;
    this.code = data.code;
    this.name = data.name;
    this.group_id = data.group_id;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Bank_Status.insert(request, {
      id: this.id,
      code: this.code,
      name: this.name,
      group_id: this.group_id,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Bank_Status.update(request, {
      id: this.id,
      code: this.code,
      name: this.name,
      group_id: this.group_id,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Bank_Status.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Bank_Status): Promise<Master_Bank_Status[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Bank_Status(item));
  }

  static async findOne(request: Request, condition: IMaster_Bank_Status): Promise<Master_Bank_Status> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Bank_Status(item);
  }

  
  static async count(request: Request, condition: IMaster_Bank_Status): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Bank_Status): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Bank_Status, condition: IMaster_Bank_Status): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Bank_Status): Promise<void> {
      return this.builder.delete(request, condition);
  }
}