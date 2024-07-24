import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { snakeCaseKeys } from "../../utility";
import { createRequest, pool } from "../../config";
import {
  Master_Province,
  Master_District,
  Master_SubDistrict,
  Master_Subject_Inquiry,
} from "../../dbclass";

export const province = async (req: Request, res: Response) => {
  try {
    let province = (await Master_Province.find(
      createRequest(),
      {}
    )) as Array<Master_Province>;

    let result = _.map(province, (n) => {
      let { province_id, name_th, name_eng } = n;

      return {
        province_id: province_id,
        province_name: name_th,
        province_name_eng: name_eng,
      };
    });

    res.status(200).send({
      status: 200,
      message: "success",
      data: result,
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const district = async (req: Request, res: Response) => {
  try {
    let district = (await Master_District.find(createRequest(), {
      province_id: req.body.province_id?.toString(),
    })) as Array<Master_District>;

    let result = _.map(district, (n) => {
      let { district_id, name_th, name_eng, province_id } = n;

      return {
        district_id: district_id,
        district_name: name_th,
        district_name_eng: name_eng,
        province_id: province_id,
      };
    });

    res.status(200).send({ status: 200, message: "success", data: result });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const subDistrict = async (req: Request, res: Response) => {
  try {
    let sub_district = (await Master_SubDistrict.find(createRequest(), {
      district_id: req.body.district_id?.toString(),
    })) as Array<Master_SubDistrict>;

    let result = _.map(sub_district, (n) => {
      let {
        sub_district_id,
        name_th,
        name_eng,
        district_id,
        province_id,
        post_code,
      } = n;

      return {
        sub_district_id: sub_district_id,
        sub_district_name: name_th,
        sub_district_name_eng: name_eng,
        district_id: district_id,
        province_id: province_id,
        post_code: post_code,
      };
    });

    res.status(200).send({ status: 200, message: "success", data: result });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

// get จาก vw
export const masterAddress = async (req: Request, res: Response) => {
  try {
    const master_address = await createRequest().query(`SELECT *
      FROM vw_ThailPost`);

    res.status(200).send({
      status: 200,
      message: "success",
      data: snakeCaseKeys(master_address.recordset),
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const masterSubjectInquiry = async (req: Request, res: Response) => {
  try {
    const master = await Master_Subject_Inquiry.find(createRequest(), {});

    const master_subject = _.map(master, (n) => {
      const { id, subject } = n;

      return {
        subject_id: id,
        subject_name: subject,
      };
    });
    res.status(200).send({
      status: 200,
      message: "success",
      data: snakeCaseKeys(master_subject),
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

//// get แบบ query
// export const masterAddress = async (req: Request, res: Response) => {
//   try {
//     const master_address = await createRequest()
//       .query(`SELECT t1.SubDistrictId, t1.NameTh as SubDistrictName, t1.NameEng as SubDistrictNameEng,
//     t2.DistrictId, t2.NameTh as DistrictName, t2.NameEng as DistrictNameEng,
//     t3.ProvinceId, t3.NameTh as ProvinceName, t3.NameEng as ProvinceNameEng,
//     t1.PostCode
//     FROM Master_SubDistrict t1
//     INNER JOIN Master_District t2 ON t1.DistrictId = t2.DistrictId
//     INNER JOIN Master_Province t3 ON t2.ProvinceId = t3.ProvinceId`);

//     res.status(200).send({
//       status: 200,
//       message: "success",
//       data: snakeCaseKeys(master_address.recordset),
//     });
//   } catch (error) {
//     res.status(500).send({ status: 500, message: error.message });
//   }
// };
