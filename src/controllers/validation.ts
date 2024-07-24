import * as yup from "yup";

const date_regex = /([12]\d{3}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01]))$/;
const date_time_regex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
const pin_regex = /^[0-9]{6}$/;
const pin_format_regex = /^(?=.{6}$)(([0-9])\2?(?!\2))+$/;
const citizen_regex = /^[0-9]{13}$/;
const laser_code_regex = /^([A-Z]{2})?[0-9]{10}$/;
const mobile_regex = /^([0]{1})??[0-9]{9}$/;
const text_regex =
  /^$|^([A-Za-zก-๙0-9.()-_])(?!.*[!"#$%&\'*+,\/:;<=>?@[\]^`{|}~])|^([A-Za-zก-๙0-9.()-_])(?!.*[!"#$%&\'*+,\/:;<=>?@[\]^`{|}~])..*$/;
const qr_data_regex =
  /[A-Za-zก-๙0-9.()-_]*\|[A-Za-zก-๙0-9.()-_]*\|[A-Za-zก-๙0-9.()-_]*$/;
const number_regex = /^[0-9]\d*$/;
const last_citizen_regex = /^[0-9]{4}$/;

export const compareKeys = (data_config: any, data_request: any) => {
  var config_Keys = data_config.sort();
  var request_Keys = Object.keys(data_request).sort();
  return JSON.stringify(config_Keys) === JSON.stringify(request_Keys);
};

export const validatorPin = (pin: any) => {
  var numbers = "0123456789";
  //If reverse sequence is also needed to be checked
  var numbersRev = "9876543210";
  //Returns false, if the number is in sequence
  return (
    numbers.indexOf(String(pin)) === -1 &&
    numbersRev.indexOf(String(pin)) === -1
  );
};

export const consentSchema = yup
  .object({
    line_id: yup.string().default("").required(),
    is_accept: yup
      .boolean()
      .required()
      .test("true", "กรุณายอมรับข้อตกลง", (value) => value != false),
  })
  .noUnknown(true);

export const checkCitizenSchema = yup.object({
  citizen_id: yup
    .string()
    .matches(
      citizen_regex,
      "กรุณากรอกหมายเลขบัตรประชาชนทั้งหมด 13 หลัก โดยไม่ต้องเว้นวรรคและไม่ต้องระบุเครื่องหมายขีด (-)"
    )
    .required(),
  laser_code: yup
    .string()
    .matches(
      laser_code_regex,
      "กรุณากรอกหมายเลขและตัวอักษรหลังบัตรประชาชนทั้งหมด 12 หลัก โดยไม่ต้องเว้นวรรคและไม่ต้องระบุเครื่องหมายขีด (-)"
    )
    .required(),
  first_name: yup.string().required(),
  last_name: yup.string().required(),
  date_of_birth: yup
    .string()
    .matches(date_regex, "birthDate must be in the format YYYY/MM/DD")
    .required(),
});

export const registerSchema = yup.object({
  line_id: yup.string().required(),
  citizen_id: yup
    .string()
    .matches(
      citizen_regex,
      "กรุณากรอกหมายเลขบัตรประชาชนทั้งหมด 13 หลัก โดยไม่ต้องเว้นวรรคและไม่ต้องระบุเครื่องหมายขีด (-)"
    )
    .required(),
  first_name: yup.string().required(),
  last_name: yup.string().required(),
  date_of_birth: yup
    .string()
    .matches(date_regex, "birthDate must be in the format YYYY/MM/DD")
    .required(),
  mobile_number: yup
    .string()
    .matches(
      mobile_regex,
      "รูปแบบเบอร์โทรศัพท์ของท่านไม่ถูกต้อง กรุณากรอกเบอร์โทรศัพท์จำนวน 10 หลัก โดยขึ้นต้นด้วย 0"
    )
    .required(),
  email: yup.string().email("รูปแบบ email ไม่ถูกต้อง").required(),
  pin: yup
    .string()
    .matches(
      pin_format_regex,
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด"
    )
    .test(
      "true",
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด",
      (pin: any) => {
        const check_pin = validatorPin(pin);
        return check_pin;
      }
    )
    .required(),
  pin_confirm: yup
    .string()
    .matches(
      pin_format_regex,
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด"
    )
    .test(
      "true",
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด",
      (pin: any) => {
        const check_pin = validatorPin(pin);
        return check_pin;
      }
    )
    .required(),
});

export const pinSchema = yup.object({
  line_id: yup.string().required(),
  pin: yup.string().matches(pin_regex, "กรุณากรอกตัวเลข 6 หลัก").required(),
  new_pin: yup
    .string()
    .matches(
      pin_format_regex,
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด"
    )
    .test(
      "true",
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด",
      (pin: any) => {
        const check_pin = validatorPin(pin);
        return check_pin;
      }
    )
    .required(),
  new_pin_confirm: yup
    .string()
    .matches(
      pin_format_regex,
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด"
    )
    .test(
      "true",
      "รหัสผ่านของท่านมีความปลอดภัยในระดับต่ำ กรุณาตั้งรหัสผ่านใหม่ตามเงื่อนไขที่กำหนด",
      (pin: any) => {
        const check_pin = validatorPin(pin);
        return check_pin;
      }
    )
    .required(),
});

export const updateEmailSchema = yup.object({
  line_id: yup.string().required(),
  pin: yup.string().matches(pin_regex, "กรุณากรอกตัวเลข 6 หลัก").required(),
  email: yup.string().email("รูปแบบ email ไม่ถูกต้อง").required(),
});

export const addressSchema = yup.object({
  line_id: yup.string(),
  pin: yup.string().matches(pin_regex, "กรุณากรอกตัวเลข 6 หลัก").required(),
  address: yup.string(),
  village: yup.string(),
  moo: yup.string(),
  floor: yup.string(),
  soi: yup.string(),
  road: yup.string(),
  sub_district_id: yup.string().required(),
  district_id: yup.string().required(),
  province_id: yup.string().required(),
  post_code: yup.string().required(),
});

export const emailSchema = yup.object({
  line_id: yup.string().required(),
  email: yup.string().email("รูปแบบ email ไม่ถูกต้อง").required(),
});

export const mobileSchema = yup.object({
  line_id: yup.string().required(),
  mobile_number: yup
    .string()
    .matches(
      mobile_regex,
      "รูปแบบเบอร์โทรศัพท์ของท่านไม่ถูกต้อง กรุณากรอกเบอร์โทรศัพท์ใหม่อีกครั้ง"
    )
    .required(),
  citizen_id:  yup.string(),
});

export const inquirySchema = yup.object({
  subject_id: yup.number().required(),
  detail: yup.string(),
  date: yup
    .string()
    .matches(date_time_regex, "รูปแบบวันที่ไม่ถูกต้อง")
    .required(),
  file_document: yup.object(),
});

export const scanQrSchema = yup.object({
  line_id: yup.string().required(),
  data: yup
    .string()
    .matches(qr_data_regex, "รูปแบบของข้อมูลไม่ถูกต้อง")
    .required(),
});

export const ncbSchema = yup.object({
  ncb_type: yup.string().required(),
  is_ncb: yup
    .boolean()
    .test(
      "true",
      "กรุณากดยอมรับข้อกำหนดและเงื่อนไขการให้บริการ",
      (value) => value != false
    )
    .required(),
  is_ncb_terms: yup
    .boolean()
    .test(
      "true",
      "กรุณากดยอมรับข้อกำหนดและเงื่อนไขการให้บริการ",
      (value) => value != false
    )
    .required(),
  booking_no: yup.string().required(),
  contract_id: yup.string().required(),
  contract_no: yup.string(),
  project_code: yup.string().required(),
  project_name: yup.string().required(),
  customer_data: yup.object().required(),
});

export const bankIdpSchema = yup.object({
  ncb_id: yup.string().required(),
  bank_code: yup.string().required(),
  bank_mode: yup.number().required(),
  pin: yup.string().matches(pin_regex, "กรุณากรอกตัวเลข 6 หลัก").required(),
});

export const customerLoanSchema = yup.object({
  loan_id: yup.string().required(),
  number_of_house: yup
    .string()
    .matches(number_regex, "กรุณากรอกข้อมูล ห้ามติดลบ"),
  number_of_debt_house: yup.string().matches(number_regex, "กรุณากรอกข้อมูล ห้ามติดลบ"),
  company_business_type_id: yup.string(),
  grade_bureau_id: yup.string(),
  welfare_id: yup.string(),
  welfare_bank_type: yup.array(),
});

export const incomeSchema = yup.object({
  loan_id: yup.string().required(),
  income: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  ot: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  commission: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  bonus: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  service_charge: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  perdiem: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  income_other_fix: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  income_other_not_fix: yup
    .number()
    .min(0, "กรุณากรอกตัวเลข ห้ามติดลบ")
    .nullable(),
  income_extra: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  income_rental: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  total_income: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
});

export const paySchema = yup.object({
  loan_id: yup.string().required(),
  pay_social_insurance: yup
    .number()
    .min(0, "กรุณากรอกตัวเลข ห้ามติดลบ")
    .nullable(),
  pay_slip_tax: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  pay_slip_cooperative: yup
    .number()
    .min(0, "กรุณากรอกตัวเลข ห้ามติดลบ")
    .nullable(),
  pay_slip_other: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  pay_providentfund: yup
    .number()
    .min(0, "กรุณากรอกตัวเลข ห้ามติดลบ")
    .nullable(),
  pay_home_loan: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  pay_car_loan: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  debt_total_credit_card: yup
    .number()
    .min(0, "กรุณากรอกตัวเลข ห้ามติดลบ")
    .nullable(),
  debt_credit_card_per_month: yup
    .number()
    .min(0, "กรุณากรอกตัวเลข ห้ามติดลบ")
    .nullable(),
  debt_cash_card: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  debt_other: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
  total_debt: yup.number().min(0, "กรุณากรอกตัวเลข ห้ามติดลบ").nullable(),
});

export const selectBankSchema = yup.object({
  loan_id: yup.string().required(),
  select_bank: yup
    .array()
    .min(1, "กรุณาเลือกธนาคาร")
    .required("กรุณาเลือกธนาคาร"),
  pin: yup.string().matches(pin_regex, "กรุณากรอกตัวเลข 6 หลัก").required(),
});

export const docSchema = yup.object({
  loan_id: yup.string().required(),
  file_document: yup.array(),
});

export const requestPinSchema = yup.object({
  line_id: yup.string().required(),
  last_citizen_id: yup.string().matches(last_citizen_regex, "กรุณาระบุหมายเลขบัตรประชาชน 4 ตัวสุดท้าย").required(),
});
