import express from "express";
import * as auth from "./auth";
import * as sms from "./sms";
import * as email from "./email";
import * as customer from "./customer";
import * as master from "./master";
import * as inquiry from "./inquiry";
import { withAuthen, withAuthenForToken } from "../../middlewares/with-authen";
import { checkPin } from "../../middlewares/pin-middlewares";
import * as ncb from "./ncb";
import * as loan from "./loan";
import * as interest from "./interest";
import * as rateLimiter from "../../middlewares/rate-limiter-redis";

const app = express.Router();

//Register
app.post("/auth/consent", auth.consent);
app.post("/auth/check-citizen", auth.checkCitizenId);
app.post("/auth/register", auth.register);
app.post("/auth/login", auth.login); //pin ตอนกดเข้า menu
app.post("/auth/token", auth.getToken); //ดึง token สำหรับเมนูที่ไม่ใช้ pin
app.post("/auth/logout", withAuthenForToken, checkPin, auth.logout);
app.post("/auth/change-pin", withAuthenForToken, checkPin, auth.changePin); //เปลี่ยน pin หน้าตั้งค่า
app.post("/auth/forgot-pin", auth.forgotPin); //ลืมรหัสผ่าน
app.post("/auth/check-pin", withAuthenForToken, auth.checkPin); // ตรวจสอบ pin กรณีกด pin จากการแก้ไขข้อมูล
app.post("/auth/check-blocked-pin", auth.checkBlockedPin); //ตรวจสอบ pin ว่าถูกบล็อคไม่ให้กดไหม

//ส่ง sms otp
app.post("/sms/request-otp", rateLimiter.requestSmsOtp, sms.requestOtp);
app.post("/sms/verify-otp", rateLimiter.verifySmsOtp, sms.verifyOtp);

//ส่ง email otp
app.post("/email/request-otp", rateLimiter.requestEmailOtp, email.requestOtp);
app.post("/email/verify-otp", rateLimiter.verifyEmailOtp, email.verifyOtp);

//ส่ง email สำหรับขอ PIN กรณีลืมรหัสผ่าน
app.post("/email/request-pin", rateLimiter.requestPin, email.requestPin);
app.post("/email/verify-pin", rateLimiter.verifyPin, email.verifyPin);

//ข้อมูล
app.post("/customer/detail", withAuthenForToken, customer.detail);
app.post("/customer/update", withAuthenForToken, checkPin, customer.update); // update email
app.post(
  "/customer/address-send-doc/detail",
  withAuthenForToken,
  customer.addressSendDoc
);
app.post(
  "/customer/address-send-doc/update",
  withAuthenForToken,
  checkPin,
  customer.updateAddressSendDoc
);

//แจ้งปัญหา
app.post("/inquiry", withAuthenForToken, inquiry.inquiry);
app.post("/inquiry/detail", withAuthenForToken, inquiry.inquiryDetail);
app.post("/inquiry/create", withAuthenForToken, inquiry.createInquiry);

//master
app.post("/master/province", master.province);
app.post("/master/district", master.district);
app.post("/master/sub-district", master.subDistrict);
app.post("/master/address", master.masterAddress);
app.post("/master/subject-inquiry", master.masterSubjectInquiry);

//NCB
app.post("/ncb/list", withAuthen, ncb.ncbListAll); //list ncb
app.post("/ncb/detail", withAuthen, ncb.ncbDetail); //รายละเอียดหลังขอ ncb
app.post("/ncb/customer", withAuthen, ncb.ncbCustomer);
app.post("/ncb/confirm/detail", withAuthen, ncb.ncbConfirmDetail); //รายละเอียดหน้า ยืนยันก่อนส่งคำขอ ncb
app.post("/ncb/re-confirm/detail", withAuthen, ncb.ncbReConfirmDetail); //รายละเอียดหน้า ยืนยันก่อนส่งคำขอ ncb อีกครั้ง กรณีสถานะ รอยืนยันตัวตน
app.post("/ncb/create", withAuthen, ncb.ncbCreate); //บันทึกข้อมูล ncb  ดึงไปดึง api ของ ncb เพื่อ check ธนาคารที่ลูกค้าลงทะเบียนไปแล้ว return แสดง bank provider
app.post("/ncb/bank-idp/list", withAuthen, ncb.ncbBankIdpList); //ดึง list bank ไว้สำหรับยืนยันตัวตน
app.post("/ncb/bank-idp/confirm", withAuthen, checkPin, ncb.ncbBankIdpConfirm); //เลือก bank เพื่อยืนยันตัวตน
app.post("/ncb/scan-qr", withAuthen, ncb.ncbScanQrCode); //กรณีขอผ่านโครงการ

//loan
app.post("/loan/scan-qr", withAuthenForToken, loan.loanScanQrCode); // scan qr and create loan
app.post("/loan/list", withAuthenForToken, loan.loanlist); //รายการขอสินเชื่อที่ยังไม่ได้ยื่นขอ
app.post("/loan/detail", withAuthenForToken, loan.loanDetail); //ข้อมูลทั่วไป
app.post("/loan/document-ncb/list", withAuthenForToken, loan.loanDocNcb); //ดึงเอกสารเครดิต ncb
app.post("/loan/document-ncb/upload", withAuthenForToken, loan.loanDocNcbUpload); //อัปโหลดเอกสารเครดิต ncb พร้อมส่งไปยัง rem แล้วจะได้เลข doc กลับมาเก็บไว้
app.post("/loan/customer/detail", withAuthenForToken, loan.loanCustomerDetail); //ข้อมูลผู้กู้
//app.post("/loan/customer/save", withAuthenForToken, loan.loanCustomerSave); //แก้ไขข้อมูลผู้กู้ กรณีผู้กู้ร่วม
app.post("/loan/address/detail", withAuthenForToken, loan.loanAddress); //ข้อมูลที่อยู่
//app.post("/loan/address/save", withAuthenForToken, loan.loanAddressSave); //บันทึกข้อมูลที่อยู่ (ลงตาม field)  ** ไม่ใช้
app.post("/loan/customer-loan/detail", withAuthenForToken, loan.loanCustomerLoanDetail); //ข้อมูลการขอสินเชื่อ (เอกสารหลัก)
app.post("/loan/customer-loan/save", withAuthenForToken, loan.loanCustomerLoanSave); //บันทึกข้อมูลการขอสินเชื่อ (เอกสารหลัก)
app.post(
  "/loan/customer-loan/income/detail",
  withAuthenForToken,
  loan.loanCustomerIncomeDetail
); //ข้อมูลรายได้
app.post(
  "/loan/customer-loan/income/save",
  withAuthenForToken,
  loan.loanCustomerIncomeSave
); //บันทึกข้อมูลรายได้
app.post(
  "/loan/customer-loan/pay/detail",
  withAuthenForToken,
  loan.loanCustomerPayDetail
); //ข้อมูลรายจ่าย
app.post("/loan/customer-loan/pay/save", withAuthenForToken, loan.loanCustomerPaySave); //บันทึกข้อมูลรายจ่าย พร้อมส่งข้อมูลไป rem
app.post("/loan/document/list", withAuthenForToken, loan.loanDocList); //ดึงเอกสาร
app.post("/loan/document/upload", withAuthenForToken, loan.loanDocUpload); //อัปโหลดเอกสาร
app.post("/loan/select-bank/list", withAuthenForToken, loan.loanSelectBankList); //ดึง list ธนาคารที่สามารถกู้ได้
app.post("/loan/select-bank/save", withAuthenForToken, checkPin, loan.loanSelectBankSave); //บันทึกข้อมูลการเลือกธนาคาร และส่งไปยัง rem
app.post(
  "/loan/history/select-bank/list",
  withAuthenForToken,
  loan.loanHistoryIsSelectBank
); //รายการประวัติธนาคารที่ยื่นกู้
app.post("/loan/history/list", withAuthenForToken, loan.loanHistorylist); //รายการประวัติขอสินเชื่อ
app.post("/loan/history/detail", withAuthenForToken, loan.loanHistoryDetail); //ดึงรายละเอียดข้อมูลประวัติการขอสินเชื่อ
app.post("/loan/history/unit/detail", withAuthenForToken, loan.loanHistoryUnit); //ดึงประวัติข้อมูลทั่วไป
app.post(
  "/loan/history/loan-customer/detail",
  withAuthenForToken,
  loan.loanHistoryLoanCustomer
); //ดึงประวัติรายชื่อผู้กู้ทั้งหมด

//เช็คสถานะสินเชื่อ
app.post("/loan/loan-status/list", withAuthenForToken, loan.loanStatusList); //list รายการขอสินเชื่อ
app.post("/loan/loan-status/detail", withAuthenForToken, loan.loanStatusDetail); //รายละเอียดรายการขอสินเชื่อ
app.post(
  "/loan/loan-status/bank/detail",
  withAuthenForToken,
  loan.loanStatusBankDetail
); //รายละเอียดรายการสถานะขอสินเชื่อตามธนาคาร
app.post(
  "/loan/loan-status/select-bank/list",
  withAuthenForToken,
  loan.loanStatusSelectBanklist
); //list ธนาคารสำหรับเลือกธนาคาร (เฉพาะ ธนาคารที่อนุมัติ)
app.post(
  "/loan/loan-status/select-bank",
  withAuthenForToken,
  checkPin,
  loan.loanStatusSelectBank
); //เลือกธนาคาร (เฉพาะ ธนาคารที่อนุมัติ)

app.post(
  "/loan/loan-status/unselect-bank",
  withAuthenForToken,
  checkPin,
  loan.loanStatusUnselectBank
); //ยกเลิกเลือกธนคาร

//ดอกเบี้ย
app.post("/interest/detail", withAuthenForToken, interest.interestDetail);

export default app;
