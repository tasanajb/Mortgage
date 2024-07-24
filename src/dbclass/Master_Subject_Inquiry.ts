import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_Subject_InquiryMethod {
  load(request: Request, id: number | IMaster_Subject_Inquiry): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Subject_Inquiry): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Subject_Inquiry {
    id?: number;
    subject?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Subject_Inquiry implements IMaster_Subject_Inquiry, IMaster_Subject_InquiryMethod {
    id?: number;
    subject?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Subject_Inquiry",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    subject: { name: "Subject", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","subject","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Subject_Inquiry, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Subject_Inquiry);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Subject_Inquiry.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Subject_Inquiry): void {
    this.id = data.id;
    this.subject = data.subject;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Subject_Inquiry.insert(request, {
      id: this.id,
      subject: this.subject,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Subject_Inquiry.update(request, {
      id: this.id,
      subject: this.subject,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Subject_Inquiry.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Subject_Inquiry): Promise<Master_Subject_Inquiry[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Subject_Inquiry(item));
  }

  static async findOne(request: Request, condition: IMaster_Subject_Inquiry): Promise<Master_Subject_Inquiry> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Subject_Inquiry(item);
  }

  static async count(request: Request, condition: IMaster_Subject_Inquiry): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Subject_Inquiry): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Subject_Inquiry, condition: IMaster_Subject_Inquiry): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Subject_Inquiry): Promise<void> {
      return this.builder.delete(request, condition);
  }
}