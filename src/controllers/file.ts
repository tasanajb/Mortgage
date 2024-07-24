import express, { Request, Response, NextFunction } from "express";
import moment from "moment";
import multer from "multer";
import { Master_File, Master_Loan } from "../dbclass";
import { createRequest } from "../config";
import sql from "mssql";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import axios from "axios";
import sharp from "sharp";
import formdata from "form-data";
import { ncbReport } from "../controllers/externals/matching-sevice";
import { loanCreditOut } from "./externals/wallet";
import {
  encryptionFileIdentifier,
  decryptionFileIdentifier,
} from "../middlewares/file-authorization";

const account_name = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
if (!account_name) throw Error("Azure Storage accountName not found");
const account_key = process.env.AZURE_STORAGE_KEY || "";

const shared_key_credential = new StorageSharedKeyCredential(
  account_name,
  account_key
);
const blob_service_client = new BlobServiceClient(
  `https://${account_name}.blob.core.windows.net`,
  shared_key_credential
);

const container_name = process.env.AZURE_STORAGE_CONTAINER_NAME;

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (files.length == 0) {
      return res
        .status(400)
        .send({ status: 400, message: "parameter files is empty" });
    }

    //1. ดึงข้อมูล
    let getdata = String(req.body.type);
    let subject = JSON.parse(getdata).subject;
    let product = process.env.AZURE_STORAGE_PRODUCT_NAME;
    let developer_code = JSON.parse(getdata)?.developer_code || "";
    let loan_id = JSON.parse(getdata)?.loan_id || "";
    let document_type = JSON.parse(getdata)?.document_type || "";
    let ref_document_name = JSON.parse(getdata)?.ref_document_name || "";
    var file = files[0];
    let file_name = JSON.parse(getdata)?.file_name || file.originalname;
    let buffer = file.buffer;
    let is_image = file.mimetype.split("/");
    let mimetype = file.mimetype;
    const name_splited = file.originalname.split(".");
    if (name_splited.length == 1) {
      return res
        .status(400)
        .send({ status: 400, message: "file extension is required" });
    }
    let ext = name_splited[name_splited.length - 1];

    let ncb_report_data: any;
    if (ref_document_name === "ncb") {
      let password: string = JSON.parse(getdata)?.ncb_password || "";
      if (password === "") {
        return res.status(400).send({
          status: 400,
          message: "กรุณาใส่รหัสสำหรับเปิดรายงานเครดิตบูโร",
        });
      }

      let check_ncb_data: any = {
        file: file,
        password: password,
        loan_id: loan_id,
        customer_id: req.customer_id,
        developer_code: developer_code,
      };

      //ตรวจสอบ file NCB PDF
      const check_ncb = await ncbReport(check_ncb_data);
      //console.log("check_ncb:", check_ncb);
      if (check_ncb.status != 200) {
        throw check_ncb;
      }
      ncb_report_data = check_ncb.data;

      //หักเครดิต loan 300บาท กรณีไม่ได้ขอ ncb ผ่านโครงการที่ขอสินเชื่อ
      let credit_out_data: any = {
        loan_id: loan_id,
        developer_code: developer_code,
        amount: process.env.WALLET_LOAN,
        is_credit: true,
      };
      const credit_out = await loanCreditOut(credit_out_data);
      if (credit_out.status != 200) {
        throw credit_out;
      }
    }

    //2. gen หมายเลขเอกสาร
    const file_runnumber = await createRequest()
      .input("RunKey", sql.NVarChar, "File")
      .input("KeyCode", sql.NVarChar, "DOC")
      .input("CreateDate", sql.Date, new Date())
      .execute("sp_CreateRunning");

    let file_key = String(file_runnumber.recordset[0]["RunKey"]);

    //2. ตั้งค่าไฟล์
    if (is_image[0] === "image") {
      let image: any = await sharp(file.buffer);
      let width_default: number = 1920;
      //let height: number = 1080;
      let percentage: any = 0;
      let image_data: any;

      if (subject === "loan") {
        //2.2. ใส่ watermark, resize  และ เปลี่ยนนามสกุลรูปภาพเป็น .jpeg
        await image.metadata().then(async function (metadata: any) {
          let height: number = metadata.height;
          let width: number = metadata.width;
          if (metadata.width > width_default) {
            percentage = width_default / metadata.width;
            height = Math.round(metadata.height * percentage);
            width = width_default;
          }

          //2.2.1. set รูแบบของ watermark
          let text = process.env.WATERMARK_TEXT;
          let svg_image = `<svg width="${width}" height="${height}">          
        <defs><pattern id="textstripe" patternUnits="userSpaceOnUse" width="400" height="200" patternTransform="rotate(-45)">                
        <text y="30" fill="#ffffff" style="fill-opacity: .25; stroke: #000000; stroke-opacity: .25;" font-size="24" stroke-width="0.5" paint-order="stroke">${text}</text>            
        </pattern></defs><rect width="100%" height="100%" fill="url(#textstripe)" /> </svg> `;
          let svg_buffer = Buffer.from(svg_image);

          //2.2.1. ใส่ watermark, resize  และ เปลี่ยนนามสกุลรูปภาพเป็น .jpeg
          image_data = await image
            .composite([
              {
                input: svg_buffer,
                top: 0,
                left: 0,
              },
            ])
            .resize({
              width: width,
              height: height,
            })
            .toFormat("jpeg", { mozjpeg: true })
            .toBuffer();
        });
        buffer = image_data;
      } else {
        //2.3. resize  และ เปลี่ยนนามสกุลรูปภาพเป็น .jpeg
        await image.metadata().then(async function (metadata: any) {
          let height: number = metadata.height;
          let width: number = metadata.width;
          if (metadata.width > width_default) {
            percentage = width_default / metadata.width;
            height = Math.round(metadata.height * percentage);
            width = width_default;
          }

          image_data = await image
            .resize({
              width: width,
              height: height,
            })
            .toFormat("jpeg", { mozjpeg: true })
            .toBuffer();
        });

        buffer = image_data;
      }

      //2.4. ตั้งชื่อไฟล์
      //file_name = file.originalname.replace(ext, "jpeg");
      file_name = file_key + "-" + file_name + ".jpeg";
      ext = "jpeg";
      mimetype = "image/jpeg";
    } else {
      file_name = file_key + "-" + file_name + "." + ext;
    }

    //3. ตรวจสอบประเภทของไฟล์
    const file_type = ["jpg", "jpeg", "png", "pdf"];
    if (file_type.includes(ext.toLowerCase()) == false) {
      throw new Error(`ระบบไม่รองรับไฟล์ .${ext}`);
    }

    //4. create container client
    const container_client = await blob_service_client.getContainerClient(
      container_name
    );
    let blob_name = `${product}/${subject}/${moment().format(
      "YYYY/MM/DD"
    )}/${file_name}`;
    if (subject === "loan") {
      blob_name = `${product}/${subject}/${developer_code}/${moment().format(
        "YYYY/MM/DD"
      )}/${file_name}`;
    }
    //5. Create blob client from container client
    const block_blob_client = await container_client.getBlockBlobClient(
      blob_name
    );
    //6. Upload ไฟล์ลง buffer
    await block_blob_client.uploadData(buffer);
    const file_part = decodeURIComponent(block_blob_client.url);
    //console.log(file_part);

    //7. บันทึกข้อมูลของไฟล์ ลง database
    var file_number = await Master_File.insert(createRequest(), {
      file_path: file_part.replace(blob_service_client.url, ""),
      file_name: file_name,
      file_size: file.size,
      file_extension: ext,
      file_type: mimetype,
      customer_id: req.customer_id,
      create_date: new Date(),
      update_date: new Date(),
      ref_id: loan_id,
      ref_type: ref_document_name,
      group_type: document_type,
      status: "temp",
    });

    //encryptionFileIdentifier
    let file_id: string = await encryptionFileIdentifier(String(file_number));

    res.status(200).json({
      id: file_id,
      name: file_name,
      file_size: file.size,
      content_type: mimetype,
      file_extension: ext,
      document_type: document_type,
      ref_document_name: ref_document_name,
      developer_code: developer_code,
      url: process.env.URL + `/files/${file_id}`,
      //ncb_report_data: ncb_report_data,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .send({ status: error.status || 500, message: error.message });
  }
};

export const getFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let file_id = await decryptionFileIdentifier(String(req.params.id));
    if (file_id === "") {
      return res.status(404).send({ status: 404, message: "file not found" });
    }

    const item = await Master_File.findOne(createRequest(), {
      id: parseInt(file_id),
      customer_id: req.customer_id,
    });

    if (!item) {
      return res.status(404).send({ status: 404, message: "file not found" });
    }

    var file_path = blob_service_client.url + item.file_path;
    const ret = await axios.get(file_path as string, {
      responseType: "arraybuffer",
    });
    // const buffer = Buffer.from(ret.data).toString("base64");

    // res.set({
    //   "Content-Type": item.file_type,
    //   "Content-Length": ret.data.length,
    // });
    // res.status(200).send({ status: 200, message: "success", file_path: file_path });

    const buffer = Buffer.from(ret.data as string, "binary");

    res.set({
      "Content-Type": item.file_type,
      "Content-Length": ret.data.length,
    });
    //res.status(200).send({ status: 200, message: "success", file_path: file_path });
    res.end(buffer, "binary");
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const removeFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let file_id = await decryptionFileIdentifier(String(req.params.id));
    if (file_id === "") {
      return res.status(404).send({ status: 404, message: "file not found" });
    }
    const file = await Master_File.findOne(createRequest(), {
      id: parseInt(file_id),
      customer_id: req.customer_id,
    });

    if (!file) {
      return res.status(404).send({ status: 404, message: "file not found" });
    }

    if(file.ref_id.substring(0, 4) === "LOAN" && file.status === "active"){
      const check_loan = await Master_Loan.findOne(createRequest(), {
        loan_id: file.ref_id,
      });
    
      if (check_loan.status !== "active") {
        return res.status(400).send({
          status: 400,
          message:
            "ไม่สามารถลบไฟล์เอกสารนี้ได้ เนื่องจากท่านได้ทำการใช้เอกสารนี้ในการยื่นขอสินเชื่อแล้ว",
        });
      }
    }
    

    let file_part = file.file_path;

    const delete_file = deleteBlob(file_part);
    if (delete_file) {
      await Master_File.delete(createRequest(), {
        id: parseInt(file_id),
        customer_id: req.customer_id,
      });
    }

    res.status(200).send({ status: 200, message: "ลบไฟล์สำเร็จ" });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
};

export const removeFileInBlobs = async (req: Request, res: Response) => {
  try {
    //หาไฟล์ที่ไม่ถูกใช้ และไม่ได้ถูกบันทึกลง blob วันนี้
    const file = await createRequest().query(`  SELECT Id, FilePath 
    FROM Master_File
    WHERE Status <> 'active' AND  CONVERT(VARCHAR(10), CreateDate, 103) < CONVERT(VARCHAR(10), getdate(), 103);`);

    let file_count: number = 0;
    for (let i = 0; i < file.recordset.length; i++) {
      try {
        let file_part = file.recordset[i]["FilePath"];

        const delete_file = await deleteBlob(file_part);
        if (delete_file) {
          await Master_File.delete(createRequest(), {
            id: parseInt(file.recordset[i]["Id"]),
          });

          file_count = file_count + 1;
        }
      } catch (error) {
        console.log(error.message);
      }
    }

    //return true;
    res.status(200).send({
      status: 200,
      message: "ลบไฟล์ที่ไม่ถูกใช้สำเร็จ ทั้งหมด " + file_count + "ไฟล์",
    });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
    //return false;
  }
};

async function deleteBlob(file_path: string) {
  try {
    // include: Delete the base blob and all of its snapshots.
    // only: Delete only the blob's snapshots and not the blob itself.
    const options: any = {
      deleteSnapshots: "include", // or 'only'
    };

    const containerClient = await blob_service_client.getContainerClient(
      container_name
    );

    let blobName = file_path.replace(`${container_name}/`, "");

    // Create blob client from container client
    const blockBlobClient = await containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete(options);

    return true;
  } catch {
    return false;
  }
}
