import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_CustomerMethod {
  load(request: Request, id: string | IMaster_Customer): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: string): Promise<void>;
  loadByData(data: IMaster_Customer): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Customer {
    id?: number;
    customer_id?: string;
    customer_id_rem?: string;
    member_id?: string;
    prefix_id?: number;
    prefix_id_eng?: number;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    first_name_eng?: string;
    middle_name_eng?: string;
    last_name_eng?: string;
    date_of_birth?: string;
    nick_name?: string;
    gender_code?: string;
    married_status_id?: number;
    age?: string;
    customer_type?: string;
    nationality_id?: number;
    race_id?: number;
    ref_code?: string;
    citizen_id?: string;
    authority?: string;
    citizen_date_of_issue?: string;
    citizen_date_of_expiry?: string;
    passport_no?: string;
    passport_country?: string;
    mobile_number?: string;
    phone_number?: string;
    inter_number?: string;
    email?: string;
    facebook?: string;
    customer_line_id?: string;
    we_chat?: string;
    whats_app?: string;
    occupation_id?: number;
    company_name?: string;
    position?: string;
    work_number?: string;
    education_id?: number;
    first_job_start_date?: string;
    current_job_start_date?: string;
    is_accept?: boolean;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Customer implements IMaster_Customer, IMaster_CustomerMethod {
    id?: number;
    customer_id?: string;
    customer_id_rem?: string;
    member_id?: string;
    prefix_id?: number;
    prefix_id_eng?: number;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    first_name_eng?: string;
    middle_name_eng?: string;
    last_name_eng?: string;
    date_of_birth?: string;
    nick_name?: string;
    gender_code?: string;
    married_status_id?: number;
    age?: string;
    customer_type?: string;
    nationality_id?: number;
    race_id?: number;
    ref_code?: string;
    citizen_id?: string;
    authority?: string;
    citizen_date_of_issue?: string;
    citizen_date_of_expiry?: string;
    passport_no?: string;
    passport_country?: string;
    mobile_number?: string;
    phone_number?: string;
    inter_number?: string;
    email?: string;
    facebook?: string;
    customer_line_id?: string;
    we_chat?: string;
    whats_app?: string;
    occupation_id?: number;
    company_name?: string;
    position?: string;
    work_number?: string;
    education_id?: number;
    first_job_start_date?: string;
    current_job_start_date?: string;
    is_accept?: boolean;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Customer",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: true },
    customer_id_rem: { name: "CustomerIdRem", type: sql.NVarChar, is_identity: false, is_primary: false },
    member_id: { name: "MemberId", type: sql.NVarChar, is_identity: false, is_primary: false },
    prefix_id: { name: "PrefixId", type: sql.Int, is_identity: false, is_primary: false },
    prefix_id_eng: { name: "PrefixIdEng", type: sql.Int, is_identity: false, is_primary: false },
    first_name: { name: "FirstName", type: sql.NVarChar, is_identity: false, is_primary: false },
    middle_name: { name: "MiddleName", type: sql.NVarChar, is_identity: false, is_primary: false },
    last_name: { name: "LastName", type: sql.NVarChar, is_identity: false, is_primary: false },
    first_name_eng: { name: "FirstNameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    middle_name_eng: { name: "MiddleNameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    last_name_eng: { name: "LastNameEng", type: sql.NVarChar, is_identity: false, is_primary: false },
    date_of_birth: { name: "DateOfBirth", type: sql.NVarChar, is_identity: false, is_primary: false },
    nick_name: { name: "NickName", type: sql.NVarChar, is_identity: false, is_primary: false },
    gender_code: { name: "GenderCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    married_status_id: { name: "MarriedStatusId", type: sql.Int, is_identity: false, is_primary: false },
    age: { name: "Age", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_type: { name: "CustomerType", type: sql.NVarChar, is_identity: false, is_primary: false },
    nationality_id: { name: "NationalityId", type: sql.Int, is_identity: false, is_primary: false },
    race_id: { name: "RaceId", type: sql.Int, is_identity: false, is_primary: false },
    ref_code: { name: "RefCode", type: sql.NVarChar, is_identity: false, is_primary: false },
    citizen_id: { name: "CitizenId", type: sql.NVarChar, is_identity: false, is_primary: false },
    authority: { name: "Authority", type: sql.NVarChar, is_identity: false, is_primary: false },
    citizen_date_of_issue: { name: "CitizenDateOfIssue", type: sql.NVarChar, is_identity: false, is_primary: false },
    citizen_date_of_expiry: { name: "CitizenDateOfExpiry", type: sql.NVarChar, is_identity: false, is_primary: false },
    passport_no: { name: "PassportNo", type: sql.NVarChar, is_identity: false, is_primary: false },
    passport_country: { name: "PassportCountry", type: sql.NVarChar, is_identity: false, is_primary: false },
    mobile_number: { name: "MobileNumber", type: sql.NVarChar, is_identity: false, is_primary: false },
    phone_number: { name: "PhoneNumber", type: sql.NVarChar, is_identity: false, is_primary: false },
    inter_number: { name: "InterNumber", type: sql.NVarChar, is_identity: false, is_primary: false },
    email: { name: "Email", type: sql.NVarChar, is_identity: false, is_primary: false },
    facebook: { name: "Facebook", type: sql.NVarChar, is_identity: false, is_primary: false },
    customer_line_id: { name: "CustomerLineId", type: sql.NVarChar, is_identity: false, is_primary: false },
    we_chat: { name: "WeChat", type: sql.NVarChar, is_identity: false, is_primary: false },
    whats_app: { name: "WhatsApp", type: sql.NVarChar, is_identity: false, is_primary: false },
    occupation_id: { name: "OccupationId", type: sql.Int, is_identity: false, is_primary: false },
    company_name: { name: "CompanyName", type: sql.NVarChar, is_identity: false, is_primary: false },
    position: { name: "Position", type: sql.NVarChar, is_identity: false, is_primary: false },
    work_number: { name: "WorkNumber", type: sql.NVarChar, is_identity: false, is_primary: false },
    education_id: { name: "EducationId", type: sql.Int, is_identity: false, is_primary: false },
    first_job_start_date: { name: "FirstJobStartDate", type: sql.NVarChar, is_identity: false, is_primary: false },
    current_job_start_date: { name: "CurrentJobStartDate", type: sql.NVarChar, is_identity: false, is_primary: false },
    is_accept: { name: "IsAccept", type: sql.Bit, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","customer_id","customer_id_rem","member_id","prefix_id","prefix_id_eng","first_name","middle_name","last_name","first_name_eng","middle_name_eng","last_name_eng","date_of_birth","nick_name","gender_code","married_status_id","age","customer_type","nationality_id","race_id","ref_code","citizen_id","authority","citizen_date_of_issue","citizen_date_of_expiry","passport_no","passport_country","mobile_number","phone_number","inter_number","email","facebook","customer_line_id","we_chat","whats_app","occupation_id","company_name","position","work_number","education_id","first_job_start_date","current_job_start_date","is_accept","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Customer, customer_id?: string) {
    if (customer_id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, customer_id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("customer_id is required.");
      }
      this.loadByData(request as IMaster_Customer);
    }
  }

  async load(request: Request, customer_id: string): Promise<void> {
      const item = await Master_Customer.findOne(request, { customer_id: customer_id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Customer): void {
    this.id = data.id;
    this.customer_id = data.customer_id;
    this.customer_id_rem = data.customer_id_rem;
    this.member_id = data.member_id;
    this.prefix_id = data.prefix_id;
    this.prefix_id_eng = data.prefix_id_eng;
    this.first_name = data.first_name;
    this.middle_name = data.middle_name;
    this.last_name = data.last_name;
    this.first_name_eng = data.first_name_eng;
    this.middle_name_eng = data.middle_name_eng;
    this.last_name_eng = data.last_name_eng;
    this.date_of_birth = data.date_of_birth;
    this.nick_name = data.nick_name;
    this.gender_code = data.gender_code;
    this.married_status_id = data.married_status_id;
    this.age = data.age;
    this.customer_type = data.customer_type;
    this.nationality_id = data.nationality_id;
    this.race_id = data.race_id;
    this.ref_code = data.ref_code;
    this.citizen_id = data.citizen_id;
    this.authority = data.authority;
    this.citizen_date_of_issue = data.citizen_date_of_issue;
    this.citizen_date_of_expiry = data.citizen_date_of_expiry;
    this.passport_no = data.passport_no;
    this.passport_country = data.passport_country;
    this.mobile_number = data.mobile_number;
    this.phone_number = data.phone_number;
    this.inter_number = data.inter_number;
    this.email = data.email;
    this.facebook = data.facebook;
    this.customer_line_id = data.customer_line_id;
    this.we_chat = data.we_chat;
    this.whats_app = data.whats_app;
    this.occupation_id = data.occupation_id;
    this.company_name = data.company_name;
    this.position = data.position;
    this.work_number = data.work_number;
    this.education_id = data.education_id;
    this.first_job_start_date = data.first_job_start_date;
    this.current_job_start_date = data.current_job_start_date;
    this.is_accept = data.is_accept;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Customer.insert(request, {
      id: this.id,
      customer_id: this.customer_id,
      customer_id_rem: this.customer_id_rem,
      member_id: this.member_id,
      prefix_id: this.prefix_id,
      prefix_id_eng: this.prefix_id_eng,
      first_name: this.first_name,
      middle_name: this.middle_name,
      last_name: this.last_name,
      first_name_eng: this.first_name_eng,
      middle_name_eng: this.middle_name_eng,
      last_name_eng: this.last_name_eng,
      date_of_birth: this.date_of_birth,
      nick_name: this.nick_name,
      gender_code: this.gender_code,
      married_status_id: this.married_status_id,
      age: this.age,
      customer_type: this.customer_type,
      nationality_id: this.nationality_id,
      race_id: this.race_id,
      ref_code: this.ref_code,
      citizen_id: this.citizen_id,
      authority: this.authority,
      citizen_date_of_issue: this.citizen_date_of_issue,
      citizen_date_of_expiry: this.citizen_date_of_expiry,
      passport_no: this.passport_no,
      passport_country: this.passport_country,
      mobile_number: this.mobile_number,
      phone_number: this.phone_number,
      inter_number: this.inter_number,
      email: this.email,
      facebook: this.facebook,
      customer_line_id: this.customer_line_id,
      we_chat: this.we_chat,
      whats_app: this.whats_app,
      occupation_id: this.occupation_id,
      company_name: this.company_name,
      position: this.position,
      work_number: this.work_number,
      education_id: this.education_id,
      first_job_start_date: this.first_job_start_date,
      current_job_start_date: this.current_job_start_date,
      is_accept: this.is_accept,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Customer.update(request, {
      id: this.id,
      customer_id: this.customer_id,
      customer_id_rem: this.customer_id_rem,
      member_id: this.member_id,
      prefix_id: this.prefix_id,
      prefix_id_eng: this.prefix_id_eng,
      first_name: this.first_name,
      middle_name: this.middle_name,
      last_name: this.last_name,
      first_name_eng: this.first_name_eng,
      middle_name_eng: this.middle_name_eng,
      last_name_eng: this.last_name_eng,
      date_of_birth: this.date_of_birth,
      nick_name: this.nick_name,
      gender_code: this.gender_code,
      married_status_id: this.married_status_id,
      age: this.age,
      customer_type: this.customer_type,
      nationality_id: this.nationality_id,
      race_id: this.race_id,
      ref_code: this.ref_code,
      citizen_id: this.citizen_id,
      authority: this.authority,
      citizen_date_of_issue: this.citizen_date_of_issue,
      citizen_date_of_expiry: this.citizen_date_of_expiry,
      passport_no: this.passport_no,
      passport_country: this.passport_country,
      mobile_number: this.mobile_number,
      phone_number: this.phone_number,
      inter_number: this.inter_number,
      email: this.email,
      facebook: this.facebook,
      customer_line_id: this.customer_line_id,
      we_chat: this.we_chat,
      whats_app: this.whats_app,
      occupation_id: this.occupation_id,
      company_name: this.company_name,
      position: this.position,
      work_number: this.work_number,
      education_id: this.education_id,
      first_job_start_date: this.first_job_start_date,
      current_job_start_date: this.current_job_start_date,
      is_accept: this.is_accept,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      customer_id: this.customer_id
    });
  }

  delete(request: Request, customer_id: string): Promise<void> {
    return Master_Customer.delete(request, {
      customer_id: customer_id
    });
  }

  static async find(request: Request, condition: IMaster_Customer): Promise<Master_Customer[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Customer(item));
  }

  static async findOne(request: Request, condition: IMaster_Customer): Promise<Master_Customer> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Customer(item);
  }

  static async count(request: Request, condition: IMaster_Customer): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Customer): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Customer, condition: IMaster_Customer): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Customer): Promise<void> {
      return this.builder.delete(request, condition);
  }
}