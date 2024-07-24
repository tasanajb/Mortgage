export const module = {
  emailOtpHtml,
  emailRequestPinHtml,
  emailInquiryHtml
};

function emailOtpHtml(body: any) {
  let html = `
  <p><span style="font-size:14px">เรียน ผู้ใช้งาน</span></p>
  <p>&nbsp;</p>
  <p><span style="font-size:14px">&nbsp;        โปรดนำรหัส (OTP) ด้านล่างนี้ไประบุในหน้ายืนยันอีเมล เพื่อยืนยันตัวตนสำหรับเข้าใช้งานระบบ ICON Digital Gateway  รหัสนี้มีอายุการใช้งาน 5 นาที&nbsp;</span></p>
  <p>&nbsp;</p>
  <table border="0" cellpadding="1" cellspacing="1" style="height:50px; width:100%">
	  <tbody>
		  <tr>
			  <td style="background-color:#d6d2fb; text-align:center; width:587px"><span style="font-size:30px"><span style="font-family:Calibri,sans-serif; letter-spacing: 15px;">${body.pin_code}</span></span></td>
		  </tr>
	  </tbody>
  </table>
  <p>&nbsp;</p>
  <p><span style="font-size:14px">Ref: ${body.ref_code}&nbsp;</span></p>
  <p style="text-align:center">&nbsp;</p>
  <p><span style="font-size:14px">ขอแสดงความนับถือ&nbsp;&nbsp;</span></p>
  <p><span style="font-size:14px">ICON Digital Gateway&nbsp;</span></p>
  <p>&nbsp;</p>
  <p>&nbsp;</p>
  <p style="text-align:center">&nbsp;</p>
  <p style="text-align:center"><img title="ICON Framework" src="${body.logo}" style="height:48px; width:84px"/></p>
  <p style="text-align:center">&nbsp;</p>
  <p style="text-align:center"><span style="font-size:14px">บริษัท ไอคอน เฟรมเวิร์ค จำกัด&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:14px">สำนักงานใหญ่ ทรู ดิจิทัล พาร์ค สุขุมวิท 101 ตึกฟีนิกซ์ ชั้น 6 ห้องเลขที่ 602&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:14px">ถนนสุขุมวิท แขวงบางจาก เขตพระโขนง กรุงเทพมหานคร ประเทศไทย 10260&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:12pt"><span style="font-family:Calibri,sans-serif"><a href="https://iconframework.com/">iconframework.com</a></span></span></p>
`;

  return html;
}

function emailRequestPinHtml(body: any) {
  let html = `
  <p><span style="font-size:14px">เรียน ผู้ใช้งาน</span></p>
  <p>&nbsp;</p>
  <p><span style="font-size:14px">&nbsp;       โปรดนำ PIN ด้านล่างนี้ไประบุในหน้า PIN เพื่อใช้สำหรับตั้งรหัสผ่านใหม่  หมายเลข PIN คือ&nbsp;</span></p>
  <p>&nbsp;</p>
  <table border="0" cellpadding="1" cellspacing="1" style="height:50px; width:100%">
	  <tbody>
		  <tr>
			  <td style="background-color:#d6d2fb; text-align:center; width:587px"><span style="font-size:30px"><span style="font-family:Calibri,sans-serif; letter-spacing: 15px;">${body.pin_code}</span></span></td>
		  </tr>
	  </tbody>
  </table>
  <p>&nbsp;</p>
  <p><span style="font-size:14px">หมายเหตุ: PIN มีอายุการใช้งาน 30 นาที หากเกินกำหนดเวลากรุณากดลืมรหัสผ่าน เพื่อขอ PIN อีกครั้ง&nbsp;</span></p>
  <p style="text-align:center">&nbsp;</p>
  <p><span style="font-size:14px">ขอแสดงความนับถือ&nbsp;&nbsp;</span></p>
  <p><span style="font-size:14px">ICON Digital Gateway&nbsp;</span></p>
  <p>&nbsp;</p>
  <p>&nbsp;</p>
  <p style="text-align:center">&nbsp;</p>
  <p style="text-align:center"><img title="ICON Framework" src="${body.logo}" style="height:48px; width:84px"/></p>
  <p style="text-align:center">&nbsp;</p>
  <p style="text-align:center"><span style="font-size:14px">บริษัท ไอคอน เฟรมเวิร์ค จำกัด&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:14px">สำนักงานใหญ่ ทรู ดิจิทัล พาร์ค สุขุมวิท 101 ตึกฟีนิกซ์ ชั้น 6 ห้องเลขที่ 602&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:14px">ถนนสุขุมวิท แขวงบางจาก เขตพระโขนง กรุงเทพมหานคร ประเทศไทย 10260&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:12pt"><span style="font-family:Calibri,sans-serif"><a href="https://iconframework.com/">iconframework.com</a></span></span></p>
`;
  return html;
}

function emailInquiryHtml(body: any) {
  let html = `
  <p><span style="font-size:14px">เรียน Support</span></p>
  <p>&nbsp;</p>
  <p><span style="font-size:14px">&nbsp;        แจ้งเรื่องร้องเรียนรายละเอียด ดังนี้&nbsp;
  <p><span style="font-size:14px"><span style="font-family:Calibri,sans-serif"><strong><span>หัวข้อ</span></strong>:
  <span>${body.subject_name}</span></span></span></p>
  <p><span style="font-size:14px"><span style="font-family:Calibri,sans-serif"><strong><span>รายละเอียด</span></strong> : 
  <span>${body.detail}</span></span></span></p>
  <p style="text-align:center">&nbsp;</p>
  <p><span style="font-size:14px">ขอแสดงความนับถือ&nbsp;&nbsp;</span></p>
  <p><span style="font-size:14px">${body.customer_name}&nbsp;</span></p>
  <p><span style="font-size:14px">${body.mobile_number}&nbsp;</span></p>
  <p><span style="font-size:14px">${body.email}&nbsp;</span></p>
  <p>&nbsp;</p>
  <p>&nbsp;</p>
  <p style="text-align:center">&nbsp;</p>
  <p style="text-align:center"><img title="ICON Framework" src="${body.logo}" style="height:48px; width:84px"/></p>
  <p style="text-align:center">&nbsp;</p>
  <p style="text-align:center"><span style="font-size:14px">บริษัท ไอคอน เฟรมเวิร์ค จำกัด&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:14px">สำนักงานใหญ่ ทรู ดิจิทัล พาร์ค สุขุมวิท 101 ตึกฟีนิกซ์ ชั้น 6 ห้องเลขที่ 602&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:14px">ถนนสุขุมวิท แขวงบางจาก เขตพระโขนง กรุงเทพมหานคร ประเทศไทย 10260&nbsp;</span></p>
  <p style="text-align:center"><span style="font-size:12pt"><span style="font-family:Calibri,sans-serif"><a href="https://iconframework.com/">iconframework.com</a></span></span></p>
`;
  return html;
}
