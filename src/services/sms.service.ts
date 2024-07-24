import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

//ส่ง sms otp
export const sendSms = async (pin_code: string, mobile: string) => {
  let data = {
    status: 0,
    message: "",
  };
  try {
    var config = {
      method: "post",
      url: process.env.SMS_MKT_URL_API,
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.SMS_MKT_API_KEY,
        secret_key: process.env.SMS_MKT_SECRET_KEY,
      },
      data: JSON.stringify({
        sender: process.env.SMS_MKT_SENDER,
        phone: mobile,
        message: `ICON Digital Gateway The SMS-OTP is ${pin_code}. OTP will be expired with in 5 mins`,
      }),
    };
    await axios(config)
      .then(function (response) {
        if (response.data.code === "000") {
          data = { status: 200, message: response.data };
        } else {
          data = { status: 500, message: response.data.detail };
        }
      })
      .catch(function (error) {
        data = { status: 500, message: error.detail };
      });

    return data;
  } catch (error) {
    data = { status: 500, message: error.message };

    return data;
  }
};
