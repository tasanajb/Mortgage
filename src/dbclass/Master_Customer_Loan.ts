import sql, { Request } from "mssql";
import { SqlBuilder } from "./SqlUtility";

interface IMaster_Customer_LoanMethod {
  load(request: Request, id: number | IMaster_Customer_Loan): Promise<void>;
  update(request: Request): Promise<void>;
  delete(request: Request, id: number): Promise<void>;
  loadByData(data: IMaster_Customer_Loan): void;
  insert(request: Request): Promise<string | number>;
}

export interface IMaster_Customer_Loan {
    id?: number;
    number_of_house?: string;
    number_of_debt_house?: string;
    company_business_type_id?: string;
    company_business_type_name?: string;
    grade_bureau_id?: string;
    grade_bureau_name?: string;
    welfare_id?: string;
    welfare_name?: string;
    welfare_bank_type?: string;
    income?: number;
    ot?: number;
    commission?: number;
    bonus?: number;
    service_charge?: number;
    perdiem?: number;
    income_other_fix?: number;
    income_other_not_fix?: number;
    income_extra?: number;
    income_rental?: number;
    total_income?: number;
    pay_social_insurance?: number;
    pay_slip_tax?: number;
    pay_slip_cooperative?: number;
    pay_slip_other?: number;
    pay_providentfund?: number;
    pay_home_loan?: number;
    pay_car_loan?: number;
    debt_total_credit_card?: number;
    debt_credit_card_per_month?: number;
    debt_cash_card?: number;
    debt_other?: number;
    total_debt?: number;
    customer_id?: string;
    loan_id?: string;
    create_date?: Date;
    update_date?: Date;
}

export class Master_Customer_Loan implements IMaster_Customer_Loan, IMaster_Customer_LoanMethod {
    id?: number;
    number_of_house?: string;
    number_of_debt_house?: string;
    company_business_type_id?: string;
    company_business_type_name?: string;
    grade_bureau_id?: string;
    grade_bureau_name?: string;
    welfare_id?: string;
    welfare_name?: string;
    welfare_bank_type?: string;
    income?: number;
    ot?: number;
    commission?: number;
    bonus?: number;
    service_charge?: number;
    perdiem?: number;
    income_other_fix?: number;
    income_other_not_fix?: number;
    income_extra?: number;
    income_rental?: number;
    total_income?: number;
    pay_social_insurance?: number;
    pay_slip_tax?: number;
    pay_slip_cooperative?: number;
    pay_slip_other?: number;
    pay_providentfund?: number;
    pay_home_loan?: number;
    pay_car_loan?: number;
    debt_total_credit_card?: number;
    debt_credit_card_per_month?: number;
    debt_cash_card?: number;
    debt_other?: number;
    total_debt?: number;
    customer_id?: string;
    loan_id?: string;
    create_date?: Date;
    update_date?: Date;

  static builder: SqlBuilder = new SqlBuilder(
    "Master_Customer_Loan",
    {
    id: { name: "Id", type: sql.Int, is_identity: true, is_primary: true },
    number_of_house: { name: "NumberOfHouse", type: sql.NVarChar, is_identity: false, is_primary: false },
    number_of_debt_house: { name: "NumberOfDebtHouse", type: sql.NVarChar, is_identity: false, is_primary: false },
    company_business_type_id: { name: "CompanyBusinessTypeId", type: sql.NVarChar, is_identity: false, is_primary: false },
    company_business_type_name: { name: "CompanyBusinessTypeName", type: sql.NVarChar, is_identity: false, is_primary: false },
    grade_bureau_id: { name: "GradeBureauId", type: sql.NVarChar, is_identity: false, is_primary: false },
    grade_bureau_name: { name: "GradeBureauName", type: sql.NVarChar, is_identity: false, is_primary: false },
    welfare_id: { name: "WelfareId", type: sql.NVarChar, is_identity: false, is_primary: false },
    welfare_name: { name: "WelfareName", type: sql.NVarChar, is_identity: false, is_primary: false },
    welfare_bank_type: { name: "WelfareBankType", type: sql.NVarChar, is_identity: false, is_primary: false },
    income: { name: "Income", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    ot: { name: "Ot", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    commission: { name: "Commission", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    bonus: { name: "Bonus", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    service_charge: { name: "ServiceCharge", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    perdiem: { name: "Perdiem", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    income_other_fix: { name: "IncomeOtherFix", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    income_other_not_fix: { name: "IncomeOtherNotFix", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    income_extra: { name: "IncomeExtra", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    income_rental: { name: "IncomeRental", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    total_income: { name: "TotalIncome", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    pay_social_insurance: { name: "PaySocialInsurance", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    pay_slip_tax: { name: "PaySlipTax", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    pay_slip_cooperative: { name: "PaySlipCooperative", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    pay_slip_other: { name: "PaySlipOther", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    pay_providentfund: { name: "PayProvidentfund", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    pay_home_loan: { name: "PayHomeLoan", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    pay_car_loan: { name: "PayCarLoan", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    debt_total_credit_card: { name: "DebtTotalCreditCard", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    debt_credit_card_per_month: { name: "DebtCreditCardPerMonth", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    debt_cash_card: { name: "DebtCashCard", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    debt_other: { name: "DebtOther", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    total_debt: { name: "TotalDebt", type: sql.Decimal(18, 2), is_identity: false, is_primary: false },
    customer_id: { name: "CustomerId", type: sql.NVarChar, is_identity: false, is_primary: false },
    loan_id: { name: "LoanId", type: sql.NVarChar, is_identity: false, is_primary: false },
    create_date: { name: "CreateDate", type: sql.DateTime, is_identity: false, is_primary: false },
    update_date: { name: "UpdateDate", type: sql.DateTime, is_identity: false, is_primary: false }
    },
    ["id"],
    ["id","number_of_house","number_of_debt_house","company_business_type_id","company_business_type_name","grade_bureau_id","grade_bureau_name","welfare_id","welfare_name","welfare_bank_type","income","ot","commission","bonus","service_charge","perdiem","income_other_fix","income_other_not_fix","income_extra","income_rental","total_income","pay_social_insurance","pay_slip_tax","pay_slip_cooperative","pay_slip_other","pay_providentfund","pay_home_loan","pay_car_loan","debt_total_credit_card","debt_credit_card_per_month","debt_cash_card","debt_other","total_debt","customer_id","loan_id","create_date","update_date"]
  );

  constructor(request?: Request | IMaster_Customer_Loan, id?: number) {
    if (id) {
      if (request == null) throw new Error("Pool request is required.");
      this.load(request as Request, id);
    }
    else {
      if (request instanceof Request) {
        throw new Error("id is required.");
      }
      this.loadByData(request as IMaster_Customer_Loan);
    }
  }

  async load(request: Request, id: number): Promise<void> {
      const item = await Master_Customer_Loan.findOne(request, { id: id });
      this.loadByData(item);
  }

  loadByData(data: IMaster_Customer_Loan): void {
    this.id = data.id;
    this.number_of_house = data.number_of_house;
    this.number_of_debt_house = data.number_of_debt_house;
    this.company_business_type_id = data.company_business_type_id;
    this.company_business_type_name = data.company_business_type_name;
    this.grade_bureau_id = data.grade_bureau_id;
    this.grade_bureau_name = data.grade_bureau_name;
    this.welfare_id = data.welfare_id;
    this.welfare_name = data.welfare_name;
    this.welfare_bank_type = data.welfare_bank_type;
    this.income = data.income;
    this.ot = data.ot;
    this.commission = data.commission;
    this.bonus = data.bonus;
    this.service_charge = data.service_charge;
    this.perdiem = data.perdiem;
    this.income_other_fix = data.income_other_fix;
    this.income_other_not_fix = data.income_other_not_fix;
    this.income_extra = data.income_extra;
    this.income_rental = data.income_rental;
    this.total_income = data.total_income;
    this.pay_social_insurance = data.pay_social_insurance;
    this.pay_slip_tax = data.pay_slip_tax;
    this.pay_slip_cooperative = data.pay_slip_cooperative;
    this.pay_slip_other = data.pay_slip_other;
    this.pay_providentfund = data.pay_providentfund;
    this.pay_home_loan = data.pay_home_loan;
    this.pay_car_loan = data.pay_car_loan;
    this.debt_total_credit_card = data.debt_total_credit_card;
    this.debt_credit_card_per_month = data.debt_credit_card_per_month;
    this.debt_cash_card = data.debt_cash_card;
    this.debt_other = data.debt_other;
    this.total_debt = data.total_debt;
    this.customer_id = data.customer_id;
    this.loan_id = data.loan_id;
    this.create_date = data.create_date;
    this.update_date = data.update_date;
  }

  insert(request: Request): Promise<string | number> {
    return Master_Customer_Loan.insert(request, {
      id: this.id,
      number_of_house: this.number_of_house,
      number_of_debt_house: this.number_of_debt_house,
      company_business_type_id: this.company_business_type_id,
      company_business_type_name: this.company_business_type_name,
      grade_bureau_id: this.grade_bureau_id,
      grade_bureau_name: this.grade_bureau_name,
      welfare_id: this.welfare_id,
      welfare_name: this.welfare_name,
      welfare_bank_type: this.welfare_bank_type,
      income: this.income,
      ot: this.ot,
      commission: this.commission,
      bonus: this.bonus,
      service_charge: this.service_charge,
      perdiem: this.perdiem,
      income_other_fix: this.income_other_fix,
      income_other_not_fix: this.income_other_not_fix,
      income_extra: this.income_extra,
      income_rental: this.income_rental,
      total_income: this.total_income,
      pay_social_insurance: this.pay_social_insurance,
      pay_slip_tax: this.pay_slip_tax,
      pay_slip_cooperative: this.pay_slip_cooperative,
      pay_slip_other: this.pay_slip_other,
      pay_providentfund: this.pay_providentfund,
      pay_home_loan: this.pay_home_loan,
      pay_car_loan: this.pay_car_loan,
      debt_total_credit_card: this.debt_total_credit_card,
      debt_credit_card_per_month: this.debt_credit_card_per_month,
      debt_cash_card: this.debt_cash_card,
      debt_other: this.debt_other,
      total_debt: this.total_debt,
      customer_id: this.customer_id,
      loan_id: this.loan_id,
      create_date: this.create_date,
      update_date: this.update_date,
    });
  }

  update(request: Request): Promise<void> {
    return Master_Customer_Loan.update(request, {
      id: this.id,
      number_of_house: this.number_of_house,
      number_of_debt_house: this.number_of_debt_house,
      company_business_type_id: this.company_business_type_id,
      company_business_type_name: this.company_business_type_name,
      grade_bureau_id: this.grade_bureau_id,
      grade_bureau_name: this.grade_bureau_name,
      welfare_id: this.welfare_id,
      welfare_name: this.welfare_name,
      welfare_bank_type: this.welfare_bank_type,
      income: this.income,
      ot: this.ot,
      commission: this.commission,
      bonus: this.bonus,
      service_charge: this.service_charge,
      perdiem: this.perdiem,
      income_other_fix: this.income_other_fix,
      income_other_not_fix: this.income_other_not_fix,
      income_extra: this.income_extra,
      income_rental: this.income_rental,
      total_income: this.total_income,
      pay_social_insurance: this.pay_social_insurance,
      pay_slip_tax: this.pay_slip_tax,
      pay_slip_cooperative: this.pay_slip_cooperative,
      pay_slip_other: this.pay_slip_other,
      pay_providentfund: this.pay_providentfund,
      pay_home_loan: this.pay_home_loan,
      pay_car_loan: this.pay_car_loan,
      debt_total_credit_card: this.debt_total_credit_card,
      debt_credit_card_per_month: this.debt_credit_card_per_month,
      debt_cash_card: this.debt_cash_card,
      debt_other: this.debt_other,
      total_debt: this.total_debt,
      customer_id: this.customer_id,
      loan_id: this.loan_id,
      create_date: this.create_date,
      update_date: this.update_date,
    }, {
      id: this.id
    });
  }

  delete(request: Request, id: number): Promise<void> {
    return Master_Customer_Loan.delete(request, {
      id: id
    });
  }

  static async find(request: Request, condition: IMaster_Customer_Loan): Promise<Master_Customer_Loan[]> {
      const recordset = await this.builder.find(request, condition);
      return recordset.map(item => new Master_Customer_Loan(item));
  }

  static async findOne(request: Request, condition: IMaster_Customer_Loan): Promise<Master_Customer_Loan> {
      const item = await this.builder.findOne(request, condition);
      return item == null ? null as any : new Master_Customer_Loan(item);
  }

  static async count(request: Request, condition: IMaster_Customer_Loan): Promise<number> {
    return await this.builder.count(request, condition);
  }

  static insert(request: Request, params: IMaster_Customer_Loan): Promise<string | number> {
      return this.builder.insert(request, params);
  }

  static update(request: Request, params: IMaster_Customer_Loan, condition: IMaster_Customer_Loan): Promise<void> {
      return this.builder.update(request, params, condition);
  }

  static delete(request: Request, condition: IMaster_Customer_Loan): Promise<void> {
      return this.builder.delete(request, condition);
  }
}