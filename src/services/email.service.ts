import { transport } from "../config/email.config";
import { createRequest } from "../config";
import { Transaction_Email } from "../dbclass";
import * as email_template from "../config/email-template.config";
import dotenv from "dotenv";
dotenv.config();

export const sendMail = async (data: any) => {
  try {
    let text: string = "";
    let html: string = "";
    let logo: string = `${process.env.URL}/images/logo-gateway.png`;
    let attachments: any = [];
    const mail_id = (await Transaction_Email.insert(createRequest(), {
      send_to: data.send_to,
      subject: data.subject,
      body: JSON.stringify(data),
      status: "pending",
    })) as number;
    let body: any = {};
    switch (data.type) {
      case "email_otp":
        body = {
          pin_code: data.pin_code,
          ref_code: data.ref_code,
          logo: logo,
        };

        html = email_template.module.emailOtpHtml(body);
        break;
      case "email_request_pin":
        body = {
          pin_code: data.pin_code,
          logo: logo,
        };

        html = email_template.module.emailRequestPinHtml(body);
        break;
      case "email_inquiry":
        body = {
          subject_name: data.subject_name,
          detail: data.detail,
          customer_name: data.customer_name,
          mobile_number: data.mobile_number,
          email: data.email,
          logo: logo,
        };

        html = email_template.module.emailInquiryHtml(body);
        attachments = data.file_document;
        break;
    }

    try {
      await transport.sendMail({
        to: (data.send_to as string).split(","),
        from: process.env.EMAIL_USERNAME,
        subject: data.subject,
        text: text,
        html: html,
        attachments: attachments,
        //   attachments: [
        //     {
        //         filename: 'how_to_add_summernote_editor_in_laravel.png',
        //         path: './uploads/how_to_add_summernote_editor_in_laravel.png'
        //     }
        // ]
      });

      await Transaction_Email.update(
        createRequest(),
        {
          effective_date: new Date(),
          sent_date: new Date(),
          status: "success",
          job_id: "",
        },
        {
          id: mail_id,
        }
      );

      return true;
    } catch (error: any) {
      await Transaction_Email.update(
        createRequest(),
        {
          effective_date: new Date(),
          error_date: new Date(),
          error_message: error.message,
          job_id: "",
        },
        {
          id: mail_id,
        }
      );

      return false;
    }
  } catch (error) {
    return false;
  }
};
