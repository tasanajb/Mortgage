import { createRequest, pool } from "../../config";
import axios from "axios";
import { snakeCaseKeys } from "../../utility";
import _, { split } from "lodash";
import {
  Master_Customer,
  Master_Customer_Address,
  Log_Api,
  Master_Project,
  Master_SubDistrict,
  Master_Developer,
  Master_Unit,
  Mapping_Customer_Unit,
} from "../../dbclass";

//ไม่มีการ update ไปหา rem จะเช็ค unit
//******* 1. เช็คใบจองห้ามซ้ำ , unit ต้องเป็นห้องว่าง ถ้าผ่าน insert เลย
//scan qr ใบจอง/ใบเสนอราคา
export const quotationFromRem = async (data_body: any) => {
  try {
    const { customer_id, data } = data_body;
    //get customer
    const check_customer = await Master_Customer.findOne(createRequest(), {
      customer_id: customer_id,
    });

    if (!check_customer) {
      return {
        status: 400,
        message: "ไม่พบข้อมูลของท่าน กรุณาลงทะเบียนเข้าใช้งาน",
      };
    }

    const data_booking = data.split("|");
    let doc_type: any = data_booking[0];
    let developer_code: any = data_booking[1];
    let contract_id: string = data_booking[2];

    const developer = await Master_Developer.findOne(createRequest(), {
      developer_code: developer_code,
    });

    if (!developer) {
      return { status: 400, message: "ไม่พบข้อมูลบริษัท" };
    }

    let headers: any = JSON.parse(developer.header_api);
    let url_api = developer.url_api;

    //1. ดึงข้อมูล ใบจองจาก REM
    const rem_booking = (await axios({
      method: "POST",
      url: `${url_api}/loan/loadLoanContract`,
      headers: headers,
      data: {
        contractId: contract_id,
      },
    })) as any;
    let type_of_borrower = "";
    //check ข้อมูลที่ได้จาก rem
    //2. ตรวจสอบเลขที่ใบจอง ที่ active ว่ามีในระบบแล้วหรือยัง ถ้ามีจะแจ้งว่าเคยมีข้อมูลนี้อยู่แล้ว ถ้าไม่มีจะให้ insert ใหม่
    //3. เพิ่มข้อมูลจาก ใบจอง ลงใน database
    if (rem_booking.data) {
      //check ข้อมูลที่ได้จาก rem
      if (rem_booking.data.statusCode != 200) {
        return {
          status: rem_booking.data.statusCode,
          message: rem_booking.data.statusDesc,
        };
      }
      let rem_booking_data = snakeCaseKeys(rem_booking.data.data);

      //***** เอาออกก่อน สำหรับทดสอบ ncb PVT */
      //3.1. หาข้อมูลลูกค้า ตามเลขบัตรประชาชนในใบจองและเลขบัตรประชาชนที่ลงทะเบียน
      let find_customer = _.find(rem_booking_data.loan_customer, function (n) {
        if (n.citizen_id === check_customer.citizen_id) {
          return true;
        }
      });

      if (!find_customer) {
        return { status: 400, message: "ไม่พบข้อมูลของท่านในใบจอง กรุณาติดต่อฝ่ายขายของโครงการ เพื่อทำการตรวจสอบข้อมูล" };
      }

      let customer = find_customer;
      type_of_borrower = customer.type_of_borrower;
      //3.2. update ข้อมูล customer
      await Master_Customer.update(
        createRequest(),
        {
          customer_id_rem: customer?.customer_id,
          prefix_id: customer?.title_th_id,
          //first_name: customer?.firstname_th,
          //last_name: customer?.lastname_th,
          middle_name: customer?.middlename_th,
          prefix_id_eng: customer?.title_en_id || 0,
          first_name_eng: customer?.firstname_en,
          last_name_eng: customer?.lastname_en,
          middle_name_eng: customer?.middlename_en,
          date_of_birth: customer?.date_of_birth,
          nick_name: customer?.nick_name || "",
          gender_code:
            customer?.gender_code != ""
              ? customer?.gender_code
              : customer?.gender_name === "หญิง"
              ? "F"
              : customer?.gender_name === "ชาย"
              ? "M"
              : "" || "",
          married_status_id: customer?.marriage_status_id,
          age: String(customer?.age),
          customer_type: customer?.customer_type,
          nationality_id: customer?.nationality_id,
          race_id: customer?.race_id,
          ref_code: customer?.ref_code,
          authority: customer?.authority || "",
          citizen_date_of_issue: customer?.doc_reference_effective_date || "",
          citizen_date_of_expiry: customer?.doc_reference_expiry_date || "",
          passport_no: customer?.passport_no || "",
          passport_country: customer?.passport_country || "",
          //mobile_number: customer.mobile_no, ไม่ให้อัพเดท
          phone_number: customer?.phone_no || "",
          inter_number: customer?.inter_no || "",
          //email: customer.email, ไม่ให้อัพเดท
          facebook: customer?.facebook || "",
          customer_line_id: customer?.line_id || "",
          we_chat: customer?.we_chat || "",
          whats_app: customer?.whats_app || "",
          occupation_id: customer?.occupation_id,
          company_name: customer?.company_name || "",
          position: customer?.position || "",
          work_number:
            customer?.company_phone || customer?.company_mobile || "",
          education_id: customer?.education_id,
          first_job_start_date: customer?.first_job_start_date,
          current_job_start_date: customer?.current_job_start_date,
          update_date: new Date(),
        },
        {
          customer_id: customer_id,
          citizen_id: customer.citizen_id,
        }
      );

      //3.3 ตรวจสอบข้อมูลที่อยู่ว่ามีแล้วหรือยัง (ไม่มี insert, มี update)
      const address = await Master_Customer_Address.findOne(createRequest(), {
        customer_id: customer_id,
        address_type_name: "ที่อยู่ในการจัดส่งเอกสาร",
      });

      if (!address) {
        let find_address_send_doc = _.find(customer.address, function (n) {
          if (n.address_type_name === "ที่อยู่ในการจัดส่งเอกสาร") {
            return true;
          }
        });
        if (find_address_send_doc) {
          const master_address = await Master_SubDistrict.findOne(
            createRequest(),
            {
              name_th: find_address_send_doc?.sub_district_name,
              post_code: find_address_send_doc?.zipcode || find_address_send_doc?.zip_code,
            }
          );

          await Master_Customer_Address.insert(createRequest(), {
            address: find_address_send_doc?.address || "",
            village: find_address_send_doc?.village || "",
            moo: find_address_send_doc?.moo || "",
            soi: find_address_send_doc?.soi || "",
            floor: find_address_send_doc?.floor || "",
            road: find_address_send_doc?.road || "",
            sub_district_id:
              master_address?.sub_district_id ||
              find_address_send_doc?.sub_district ||
              "",
            sub_district_name: find_address_send_doc?.sub_district_name || "",
            district_id:
              master_address?.district_id ||
              find_address_send_doc?.district ||
              "",
            district_name: find_address_send_doc?.district_name || "",
            province_id:
              master_address?.province_id ||
              find_address_send_doc?.province ||
              "",
            province_name: find_address_send_doc?.province_name || "",
            post_code: find_address_send_doc?.zipcode || find_address_send_doc?.zip_code || "",
            customer_id: customer_id,
            address_type: find_address_send_doc?.address_type || "",
            address_type_name: find_address_send_doc?.address_type_name || "",
          });
        }
      }
      //******* end */

      //3.4. check master project  and insert
      const project = await Master_Project.findOne(createRequest(), {
        project_code: rem_booking_data.project_code,
        developer_code: developer_code,
      });

      if (!project) {
        await Master_Project.insert(createRequest(), {
          project_code: rem_booking_data.project_code,
          project_name: rem_booking_data.project_name,
          project_type: rem_booking_data.project_type,
          project_type_name: rem_booking_data.project_type_name,
          developer_code: developer_code,
          developer_name: rem_booking_data.developer_name,
        });
      }

      await Master_Developer.update(
        createRequest(),
        {
          developer_name: rem_booking_data?.developer_name,
          developer_image_url:
            rem_booking_data?.developer_image_url ||
            process.env.URL + "/images/noimage.jpg",
          update_date: new Date(),
        },
        {
          developer_code: developer_code,
        }
      );

      //3.5. ตรวจสอบ และบันทึก unit
      let unit_data = rem_booking_data.collateral_info[0];
      let unit_id = "";
      if (unit_data) {
        unit_id = unit_data.unit_id;
        const check_unit = await Master_Unit.findOne(createRequest(), {
          unit_id: unit_id,
          project_code: developer_code,
        });

        //3.4.1 check unit
        if (!check_unit) {
          await Master_Unit.insert(createRequest(), {
            unit_id: unit_id,
            unit_no: unit_data.unit_no,
            unit_type: String(unit_data.unit_type),
            unit_type_name: unit_data.unit_type_name,
            collateral_price: rem_booking_data.total_collateral_price,
            title_deed_no: unit_data.title_deed_no,
            floor_no: unit_data.floor_no,
            zone_no: unit_data.zone_no,
            building_no: unit_data.building_no,
            model_name: unit_data.model_name,
            project_code: developer_code,
            project_name: rem_booking_data.project_name,
            developer_code: rem_booking_data.developer,
          });
        } else {
          await Master_Unit.update(
            createRequest(),
            {
              unit_no: unit_data.unit_no,
              unit_type: String(unit_data?.unit_type),
              unit_type_name: unit_data.unit_type_name,
              collateral_price: rem_booking_data.total_collateral_price,
              title_deed_no: unit_data.title_deed_no,
              floor_no: unit_data.floor_no,
              zone_no: unit_data.zone_no,
              building_no: unit_data.building_no,
              model_name: unit_data.model_name,
              update_date: new Date(),
            },
            {
              unit_id: unit_id,
              project_code: rem_booking_data?.project_code,
              developer_code: developer_code,
            }
          );
        }

        //3.6. check map customer unit and insert
        const customer_unit = await Mapping_Customer_Unit.findOne(
          createRequest(),
          {
            customer_id: customer_id,
            unit_id: unit_id,
          }
        );

        if (!customer_unit) {
          await Mapping_Customer_Unit.insert(createRequest(), {
            customer_id: customer_id,
            unit_id: unit_id,
          });
        }
      }
    }

    return {
      status: 200,
      message: "success",
      data: {
        rem_booking: rem_booking.data.data,
        type_of_borrower: type_of_borrower,
      },
    };
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/externals/rem-quotation",
      body: JSON.stringify(data_body),
      error_message: error.message,
    });
    return { status: 500, message: error.message };
  }
};
