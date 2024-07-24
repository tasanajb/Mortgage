import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface ITransaction_Ncb_PaymentMethod {
  load(request: Request, id: number | ITransaction_Ncb_Payment): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: ITransaction_Ncb_Payment): void;
  insert(request: Request): Promise<string | number>;
}

export interface ITransaction_Ncb_Payment {
    id?: number;
    create_date?: Date;
    update_date?: Date;
}

export class Transaction_Ncb_Payment implements ITransaction_Ncb_Payment, ITransaction_Ncb_PaymentMethod {
    id?: number;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Transaction_Ncb_Payment",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","create_date","update_date"]
  );

  constructor(request?: Request | ITransaction_Ncb_Payment, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as ITransaction_Ncb_Payment);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Transaction_Ncb_Payment.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: ITransaction_Ncb_Payment): void {
    this.id = data.id;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Transaction_Ncb_Payment.insert(request, {
      id: this.id,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Transaction_Ncb_Payment.update(request, {
      id: this.id,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Transaction_Ncb_Payment.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: ITransaction_Ncb_Payment): Promise<Transaction_Ncb_Payment[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Transaction_Ncb_Payment(item));
  }

  static async findOne(request: Request, condition: ITransaction_Ncb_Payment): Promise<Transaction_Ncb_Payment> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Transaction_Ncb_Payment(item);
  }

  static async count(request: Request, condition: ITransaction_Ncb_Payment): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: ITransaction_Ncb_Payment): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: ITransaction_Ncb_Payment, condition: ITransaction_Ncb_Payment): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: ITransaction_Ncb_Payment): Promise<void> {
      return this.builder.delete(request, condition);
  }
}