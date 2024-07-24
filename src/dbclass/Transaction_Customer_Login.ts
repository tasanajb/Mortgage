import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ITransaction_Customer_LoginMethod {
  load(request: Request, id: number | ITransaction_Customer_Login): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ITransaction_Customer_Login): void;
  insert(request: Request): Promise<string | number>;
}

export interface ITransaction_Customer_Login {
    id?: number;
    line_id?: string;
    token_id?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Transaction_Customer_Login implements ITransaction_Customer_Login, ITransaction_Customer_LoginMethod {
    id?: number;
    line_id?: string;
    token_id?: string;
    status?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Transaction_Customer_Login",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    line_id: { name: "LineId", type: sql.NVarChar, is_identity: false, is_primary: false },
    token_id: { name: "TokenId", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    [],
    ["id","line_id","token_id","status","create_date","update_date"]
  );

  constructor(request?: Request | ITransaction_Customer_Login, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ITransaction_Customer_Login);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Transaction_Customer_Login.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ITransaction_Customer_Login): void {
    this.id = data.id;
    this.line_id = data.line_id;
    this.token_id = data.token_id;
    this.status = data.status;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Transaction_Customer_Login.insert(request, {
      id: this.id,
      line_id: this.line_id,
      token_id: this.token_id,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Transaction_Customer_Login.update(request, {
      id: this.id,
      line_id: this.line_id,
      token_id: this.token_id,
      status: this.status,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Transaction_Customer_Login.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ITransaction_Customer_Login): Promise<Transaction_Customer_Login[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Transaction_Customer_Login(item));
  }

  static async findOne(request: Request, condition: ITransaction_Customer_Login): Promise<Transaction_Customer_Login> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Transaction_Customer_Login(item);
  }

  static async count(request: Request, condition: ITransaction_Customer_Login): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ITransaction_Customer_Login): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ITransaction_Customer_Login, condition: ITransaction_Customer_Login): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ITransaction_Customer_Login): Promise<void> {
      return this.builder.delete(request, condition);
  }
}