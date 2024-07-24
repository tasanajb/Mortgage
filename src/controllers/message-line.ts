import { Transaction_Notification_Line } from "../dbclass";
import * as messageLine from "../config/message-template.config";
import * as lineService from "../services/line.sevice";
import { createRequest, pool } from "../config";

export const registerSuccessMessage = async (data: any) => {
  try {
    let msg: any = {};
    msg = messageLine.module.messageRegisterSuccess(data);
    await lineService.sendMessageToUserByLineMessageAPI(data.line_id, msg);

    await welcomeMessage(data);

    return true;
  } catch (error) {
    return false;
  }
};

export const welcomeMessage = async (data: any) => {
  try {
    let msg: any = {};
    msg = messageLine.module.messageWelcome(
      String(`${process.env.URL}${process.env.BACKGROUND_MESSAGE_LINE}`)
    );
    await lineService.sendMessageToUserByLineMessageAPI(data.line_id, msg);

    return true;
  } catch (error) {
    return false;
  }
};

export const ncbSuccess = async (data: any) => {
  try {
    let msg: any = {};
    msg = messageLine.module.messageNcbSuccess(
      String(`${process.env.URL}${process.env.BACKGROUND_MESSAGE_LINE}`),
      data,
      String(process.env.NCB_URL_MESSAGE_LINE),
    );
    const noti_id: any = await Transaction_Notification_Line.insert(
      createRequest(),
      {
        send_to: data.line_id,
        customer_id: data.customer_id,
        subject: "ดำเนินการยืนยันเรียบร้อย",
        body: JSON.stringify(msg),
        create_date: new Date(),
        effective_date: new Date(),
        status: "pending",
      }
    );

    await lineService.sendMessageToUserByLineMessageAPI(data.line_id, msg);

    await Transaction_Notification_Line.update(
      createRequest(),
      {
        sent_date: new Date(),
        status: "success",
      },
      {
        id: parseInt(noti_id),
      }
    );

    return true;
  } catch (error) {
    return false;
  }
};

export const ncbError = async (data: any) => {
  try {
    let msg: any = {};
    msg = messageLine.module.messageNcbError(data);
    const noti_id: any = await Transaction_Notification_Line.insert(
      createRequest(),
      {
        send_to: data.line_id,
        customer_id: data.customer_id,
        subject: data.ncb_message,
        body: JSON.stringify(msg),
        create_date: new Date(),
        effective_date: new Date(),
        status: "pending",
      }
    );

    await lineService.sendMessageToUserByLineMessageAPI(data.line_id, msg);

    await Transaction_Notification_Line.update(
      createRequest(),
      {
        sent_date: new Date(),
        status: "success",
      },
      {
        id: parseInt(noti_id),
      }
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const ncbTimeOutAndReject = async (data: any) => {
  try {
    let msg: any = {};
    msg = messageLine.module.messageNcbTimeOutAndReject(data);
    const noti_id: any = await Transaction_Notification_Line.insert(
      createRequest(),
      {
        send_to: data.line_id,
        customer_id: data.customer_id,
        subject: data.ncb_message,
        body: JSON.stringify(msg),
        create_date: new Date(),
        effective_date: new Date(),
        status: "pending",
      }
    );

    await lineService.sendMessageToUserByLineMessageAPI(data.line_id, msg);

    await Transaction_Notification_Line.update(
      createRequest(),
      {
        sent_date: new Date(),
        status: "success",
      },
      {
        id: parseInt(noti_id),
      }
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const ncbErrorBank = async (data: any) => {
  try {
    let msg: any = {};
    msg = messageLine.module.messageNcbErrorฺBank(
      String(`${process.env.URL}${process.env.BACKGROUND_MESSAGE_LINE}`),
      data
    );
    const noti_id: any = await Transaction_Notification_Line.insert(
      createRequest(),
      {
        send_to: data.line_id,
        customer_id: data.customer_id,
        subject: "รอยืนยันตัวตน",
        body: JSON.stringify(msg),
        create_date: new Date(),
        effective_date: new Date(),
        status: "pending",
      }
    );

    await lineService.sendMessageToUserByLineMessageAPI(data.line_id, msg);

    await Transaction_Notification_Line.update(
      createRequest(),
      {
        sent_date: new Date(),
        status: "success",
      },
      {
        id: parseInt(noti_id),
      }
    );

    return true;
  } catch (error) {
    return false;
  }
};

export const ncbRequestedError = async (data: any) => {
  try {
    let msg: any = {};
    msg = messageLine.module.messageNcbRequestedError(
      String(`${process.env.URL}${process.env.BACKGROUND_MESSAGE_LINE}`),
      data
    );
    const noti_id: any = await Transaction_Notification_Line.insert(
      createRequest(),
      {
        send_to: data.line_id,
        customer_id: data.customer_id,
        subject: "ขออภัยไม่สามารถดำเนินการต่อได้ กรุณาทำรายการใหม่อีกครั้ง",
        body: JSON.stringify(msg),
        create_date: new Date(),
        effective_date: new Date(),
        status: "pending",
      }
    );

    await lineService.sendMessageToUserByLineMessageAPI(data.line_id, msg);

    await Transaction_Notification_Line.update(
      createRequest(),
      {
        sent_date: new Date(),
        status: "success",
      },
      {
        id: parseInt(noti_id),
      }
    );

    return true;
  } catch (error) {
    return false;
  }
};
