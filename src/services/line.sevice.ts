import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

//link menu หลังจาก login
export const lineOaLinkMenuToUser = async (line_id: string) => {
  try {
    await axios({
      url: `${process.env.LINE_URL}/user/${line_id}/richmenu/${process.env.LINE_MENU}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINE_TOKEN}`,
      },
    });

    return true;
  } catch (error) {
    return false;
  }
};

//unlink menu หลังจาก logout
export const lineOaUnLinkMenuToUser = async (line_id: string) => {
  try {
    await axios({
      url: `${process.env.LINE_URL}/user/${line_id}/richmenu`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.LINE_TOKEN}`,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
};

//send message
export const sendMessageToUserByLineMessageAPI = async (
  line_id: string,
  msg: string
) => {
  try {
    await axios({
      url: `${process.env.LINE_URL}/message/push`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LINE_TOKEN}`,
      },
      data: {
        to: line_id,
        messages: [msg],
      },
    });

    return true;
  } catch (error) {
    return false;
  }
};

//get line profile
export const getUserLineProfile = async (line_id: string) => {
  try {
    const response = await axios({
      url: `${process.env.LINE_URL}/profile/${line_id}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.LINE_TOKEN}`,
      },
    });
    return JSON.parse(JSON.stringify(response.data));
  } catch (error) {
    return false;
  }
};
