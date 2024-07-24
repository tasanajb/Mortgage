import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_FileMethod {
  load(request: Request, id: number | IMaster_File): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_File): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_File {
    id?: number;
    ref_id?: string;
    ref_type?: string;
    group_type?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    file_extension?: string;
    file_type?: string;
    status?: string;
    remark_th?: string;
    remark_eng?: string;
    description_th?: string;
    description_eng?: string;
    customer_id?: string;
    sort_id?: number;
    create_date?: Date;
    update_date?: Date;
}

export class Master_File implements IMaster_File, IMaster_FileMethod {
    id?: number;
    ref_id?: string;
    ref_type?: string;
    group_type?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    file_extension?: string;
    file_type?: string;
    status?: string;
    remark_th?: string;
    remark_eng?: string;
    description_th?: string;
    description_eng?: string;
    customer_id?: string;
    sort_id?: number;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_File",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    ref_id: { name: "RefId", type: sql.NVarChar, is_identity: false, is_primary: false },
    ref_type: { name: "RefType", type: sql.NVarChar, is_identity: false, is_primary: false },
    group_type: { name: "GroupType", type: sql.NVarChar, is_identity: false, is_primary: false },
    file_path: { name: "FilePath", type: sql.NVarChar, is_identity: false, is_primary: false },
    file_name: { name: "FileName", type: sql.NVarChar, is_identity: false, is_primary: false },
    file_size: { name: "FileSize", type: sql.BigInt, is_identity: false, is_primary: false },
    file_extension: { name: "FileExtension", type: sql.NVarChar, is_identity: false, is_primary: false },
    file_type: { name: "FileType", type: sql.NVarChar, is_identity: false, is_primary: false },
    status: { name: "Status", type: sql.NVarChar, is_identity: false, is_primary: false },
    remark_th: { name: "RemarkTh", type: sql.NVarChar, is_identity: false, is_primary: false },
    remark_eng: { name: "RemarkEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    description_th: { name: "DescriptionTh", type: sql.NVarChar, is_identity: false, is_primary: false },
    description_eng: { name: "DescriptionEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    sort_id: { name: "SortId", type: sql.Int, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","ref_id","ref_type","group_type","file_path","file_name","file_size","file_extension","file_type","status","remark_th","remark_eng","description_th","description_eng","customer_id","sort_id","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_File, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_File);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_File.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_File): void {
    this.id = data.id;
    this.ref_id = data.ref_id;
    this.ref_type = data.ref_type;
    this.group_type = data.group_type;
    this.file_path = data.file_path;
    this.file_name = data.file_name;
    this.file_size = data.file_size;
    this.file_extension = data.file_extension;
    this.file_type = data.file_type;
    this.status = data.status;
    this.remark_th = data.remark_th;
    this.remark_eng = data.remark_eng;
    this.description_th = data.description_th;
    this.description_eng = data.description_eng;
    this.customer_id = data.customer_id;
    this.sort_id = data.sort_id;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_File.insert(request, {
      id: this.id,
      ref_id: this.ref_id,
      ref_type: this.ref_type,
      group_type: this.group_type,
      file_path: this.file_path,
      file_name: this.file_name,
      file_size: this.file_size,
      file_extension: this.file_extension,
      file_type: this.file_type,
      status: this.status,
      remark_th: this.remark_th,
      remark_eng: this.remark_eng,
      description_th: this.description_th,
      description_eng: this.description_eng,
      customer_id: this.customer_id,
      sort_id: this.sort_id,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_File.update(request, {
      id: this.id,
      ref_id: this.ref_id,
      ref_type: this.ref_type,
      group_type: this.group_type,
      file_path: this.file_path,
      file_name: this.file_name,
      file_size: this.file_size,
      file_extension: this.file_extension,
      file_type: this.file_type,
      status: this.status,
      remark_th: this.remark_th,
      remark_eng: this.remark_eng,
      description_th: this.description_th,
      description_eng: this.description_eng,
      customer_id: this.customer_id,
      sort_id: this.sort_id,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_File.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_File): Promise<Master_File[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_File(item));
  }

  static async findOne(request: Request, condition: IMaster_File): Promise<Master_File> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null : new Master_File(item);
  }

  static insert(request: Request, params: IMaster_File): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_File, condition: IMaster_File): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_File): Promise<void> {
      return this.builder.delete(request, condition);
  }
}