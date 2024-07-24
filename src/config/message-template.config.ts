export const module = {
  messageRegisterSuccess,
  messageWelcome,
  messagePaymentSuccess,
  messageNcbSuccess,
  messageNcbTimeout,
  messageNcbRejected,
  messageNcbError,
  messageNcbTimeOutAndReject,
  messageNcbErrorฺBank,
  messageNcbRequestedError
};

function messageRegisterSuccess(data: any) {
  let msg = {
    type: "flex",
    altText: `ยินดีต้อนรับ คุณ ${data.display_name}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "image",
                    url: data.picture_url,
                    aspectMode: "cover",
                    size: "full",
                  },
                ],
                cornerRadius: "100px",
                width: "60px",
                height: "60px",
                margin: "sm",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    contents: [
                      {
                        type: "span",
                        text: "ยินดีต้อนรับ",
                        color: "#000000",
                        size: "14px",
                      },
                    ],
                    size: "sm",
                    wrap: true,
                  },
                  {
                    type: "separator",
                    color: "#5A6980",
                    margin: "md",
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      {
                        type: "text",
                        text: `" คุณ ${data.display_name} "`,
                        size: "14px",
                        color: "#000000",
                      },
                    ],
                    spacing: "sm",
                    margin: "md",
                  },
                ],
                spacing: "xs",
                paddingAll: "sm",
              },
            ],
            paddingAll: "20px",
            spacing: "xl",
          },
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageWelcome(image: string) {
  let msg = {
    type: "flex",
    altText: "บัญชีของท่านได้ลงทะเบียนสำเร็จแล้ว",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: image,
            aspectMode: "cover",
            aspectRatio: "20:10",
            size: "full",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "บัญชีของท่านได้ลงทะเบียน",
                wrap: true,
                color: "#0FFF73",
                size: "20px",
                weight: "bold",
              },
              {
                type: "text",
                text: "สำเร็จแล้ว",
                wrap: true,
                color: "#0FFF73",
                size: "20px",
                weight: "bold",
              },
              {
                type: "text",
                text: "ท่านสามารถเริ่มใช้งานระบบ",
                color: "#0FFF73",
                size: "20px",
                weight: "bold",
                wrap: true,
                offsetTop: "md",
              },
              {
                type: "text",
                text: "ขอสินเชื่อที่อยู่อาศัยได้ทันที",
                color: "#0FFF73",
                size: "20px",
                weight: "bold",
                wrap: true,
                offsetTop: "md",
              },
            ],
            position: "absolute",
            spacing: "xs",
            paddingStart: "10%",
            paddingAll: "10%",
          },
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messagePaymentSuccess(image: string) {
  let msg = {
    type: "flex",
    altText: "ท่านได้ชำระเงินเรียบร้อยแล้ว",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: image,
            aspectMode: "cover",
            aspectRatio: "20:10",
            size: "full",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ท่านได้ชำระเงินเรียบร้อยแล้ว",
                wrap: true,
                color: "#0FFF73",
                size: "20px",
              },
              {
                type: "text",
                text: '" คลิกเพื่อยืนยันตัวตน "',
                color: "#ffffff",
                size: "20px",
                align: "start",
              },
            ],
            position: "absolute",
            spacing: "xs",
            offsetTop: "20%",
            width: "100%",
            paddingStart: "20%",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "N",
                    color: "#ffffff",
                    size: "12px",
                    weight: "bold",
                    align: "center",
                    margin: "sm",
                  },
                ],
                width: "25px",
                height: "25px",
                position: "absolute",
                backgroundColor: "#EC3D44",
                cornerRadius: "xxl",
                offsetStart: "90%",
                offsetTop: "15px",
              },
            ],
            width: "100%",
            position: "absolute",
            height: "50px",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "ยืนยันตัวตน",
                  uri: "http://linecorp.com/",
                },
                style: "link",
                color: "#ffffff",
                gravity: "center",
                height: "sm",
              },
            ],
            position: "absolute",
            offsetStart: "20%",
            backgroundColor: "#27AE60",
            cornerRadius: "md",
            width: "40%",
            height: "40px",
            background: {
              type: "linearGradient",
              startColor: "#00FF2D",
              endColor: "#006A2A",
              centerColor: "#00C42C",
              angle: "111.3deg",
            },
            offsetBottom: "20%",
          },
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageNcbSuccess(image: string, data: any, url_line: string) {
  let msg = {
    type: "flex",
    altText: "ท่านดำเนินการยืนยันตัวตนสำเร็จแล้ว",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: image,
            aspectMode: "cover",
            aspectRatio: "20:10",
            size: "full",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ท่านดำเนินการยืนยันตัวตนสำเร็จแล้ว",
                wrap: true,
                color: "#0FFF73",
                size: "17px",
              },
              {
                type: "text",
                text: "ระบบจะทำการส่งรายงานเครดิตบูโร",
                wrap: true,
                color: "#0FFF73",
                size: "17px",
              },
              {
                type: "text",
                text: "(E-Credit Report)",
                wrap: true,
                color: "#0FFF73",
                size: "17px",
              },
              {
                type: "text",
                text: "ไปยัง Email ที่ท่านได้ลงทะเบียนไว้",
                wrap: true,
                color: "#0FFF73",
                size: "17px",
              },
            ],
            position: "absolute",
            spacing: "xs",
            width: "80%",
            offsetStart: "10%",
            offsetEnd: "10%",
            offsetTop: "10%",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "N",
                    color: "#ffffff",
                    size: "12px",
                    weight: "bold",
                    align: "center",
                    margin: "sm",
                  },
                ],
                width: "25px",
                height: "25px",
                position: "absolute",
                backgroundColor: "#EC3D44",
                cornerRadius: "xxl",
                offsetStart: "90%",
                offsetTop: "15px",
              },
            ],
            width: "100%",
            position: "absolute",
            height: "50px",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "รายละเอียดคำขอ",
                  //uri: `https://liff.line.me/1657792203-VRlDrrN6?ncb_id=${data.ncb_id}`,
                  uri: `${url_line}?ncb_id=${data.ncb_id}`,
                },
                style: "link",
                color: "#000000",
                gravity: "center",
                height: "sm",
              },
            ],
            position: "absolute",
            offsetStart: "20%",
            backgroundColor: "#27AE60",
            cornerRadius: "md",
            width: "50%",
            height: "40px",
            background: {
              type: "linearGradient",
              startColor: "#D0D2D4",
              endColor: "#BFBEBF",
              centerColor: "#EEEEEE",
              angle: "180.69deg",
            },
            offsetBottom: "5%",
          },
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageNcbTimeout(image: string, data: any) {
  let msg = {
    type: "flex",
    altText: "ทำรายการไม่สำเร็จ",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: image,
            aspectMode: "cover",
            aspectRatio: "20:10",
            size: "full",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ทำรายการไม่สำเร็จ",
                wrap: true,
                color: "#0FFF73",
                size: "18px",
              },
              {
                type: "text",
                text: "เนื่องจากหมดเวลาทำรายการ",
                wrap: true,
                color: "#0FFF73",
                size: "18px",
              },
              {
                type: "text",
                text: `รหัส ${data.ncb_id}`,
                color: "#ffffff",
                size: "18px",
              },
            ],
            position: "absolute",
            spacing: "xs",
            paddingStart: "20%",
            width: "100%",
            offsetTop: "15%",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "N",
                    color: "#ffffff",
                    size: "12px",
                    weight: "bold",
                    align: "center",
                    margin: "sm",
                  },
                ],
                width: "25px",
                height: "25px",
                position: "absolute",
                backgroundColor: "#EC3D44",
                cornerRadius: "xxl",
                offsetStart: "90%",
                offsetTop: "15px",
              },
            ],
            width: "100%",
            position: "absolute",
            height: "50px",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "รายละเอียดคำขอ",
                  uri: `https://api-dev.icondigitalgateway.com?line_id=${data.line_id}&nac_id=${data.ncb_id}`,
                },
                style: "link",
                color: "#000000",
                gravity: "center",
                height: "sm",
              },
            ],
            position: "absolute",
            offsetStart: "20%",
            backgroundColor: "#27AE60",
            cornerRadius: "md",
            width: "50%",
            height: "40px",
            background: {
              type: "linearGradient",
              startColor: "#D0D2D4",
              endColor: "#BFBEBF",
              centerColor: "#EEEEEE",
              angle: "180.69deg",
            },
            offsetBottom: "15%",
          },
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageNcbRejected(image: string, data: any) {
  let msg = {
    type: "flex",
    altText: "ทำรายการไม่สำเร็จ",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: image,
            aspectMode: "cover",
            aspectRatio: "20:10",
            size: "full",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ทำรายการไม่สำเร็จ",
                wrap: true,
                color: "#0FFF73",
                size: "18px",
              },
              {
                type: "text",
                text: "เนื่องจากถูกปฏิเสธการทำรายการ",
                wrap: true,
                color: "#0FFF73",
                size: "18px",
              },
              {
                type: "text",
                text: `รหัส ${data.ncb_id}`,
                color: "#ffffff",
                size: "18px",
              },
            ],
            position: "absolute",
            spacing: "xs",
            paddingStart: "20%",
            width: "100%",
            offsetTop: "15%",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "N",
                    color: "#ffffff",
                    size: "12px",
                    weight: "bold",
                    align: "center",
                    margin: "sm",
                  },
                ],
                width: "25px",
                height: "25px",
                position: "absolute",
                backgroundColor: "#EC3D44",
                cornerRadius: "xxl",
                offsetStart: "90%",
                offsetTop: "15px",
              },
            ],
            width: "100%",
            position: "absolute",
            height: "50px",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "รายละเอียดคำขอ",
                  uri: `https://api-dev.icondigitalgateway.com?line_id=${data.line_id}&nac_id=${data.ncb_id}`,
                },
                style: "link",
                color: "#000000",
                gravity: "center",
                height: "sm",
              },
            ],
            position: "absolute",
            offsetStart: "20%",
            backgroundColor: "#27AE60",
            cornerRadius: "md",
            width: "50%",
            height: "40px",
            background: {
              type: "linearGradient",
              startColor: "#D0D2D4",
              endColor: "#BFBEBF",
              centerColor: "#EEEEEE",
              angle: "180.69deg",
            },
            offsetBottom: "15%",
          },
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageNcbError(data: any) {
  let msg = {
    type: "flex",
    altText: `${data.ncb_message}`,
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: `${data.image}`,
            aspectRatio: "1:1",
            aspectMode: "fit",
            gravity: "center",
            align: "center",
            size: "full",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `ReferenceID : ${data.ncb_id}`,
                align: "center",
                weight: "bold",
                color: "#000000",
                size: "14px",
              },
            ],
            width: "100%",
            position: "absolute",
            spacing: "none",
            offsetBottom: "25%",
          },
        ],
        backgroundColor: "#424F6C",
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageNcbTimeOutAndReject(data: any) {
  let msg = {
    type: "flex",
    altText: `${data.ncb_message}`,
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: `${data.image}`,
            aspectRatio: "1:1",
            aspectMode: "fit",
            gravity: "center",
            align: "center",
            size: "full",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `ReferenceID : ${data.ncb_id}`,
                align: "center",
                weight: "bold",
                color: "#000000",
                size: "14px",
              },
            ],
            width: "100%",
            position: "absolute",
            spacing: "none",
            offsetBottom: "20%",
          },
        ],
        backgroundColor: "#424F6C",
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageNcbErrorฺBank(image: string, data: any) {
  let msg = {
    type: "flex",
    altText: "รอยืนยันตัวตน",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: image,
            aspectMode: "cover",
            aspectRatio: "20:10",
            size: "full",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "รอยืนยันตัวตน",
                wrap: true,
                color: "#0FFF73",
                size: "18px",
              },
              {
                type: "text",
                text: "กรุณาลงทะเบียน NDID กับธนาคาร",
                wrap: true,
                color: "#0FFF73",
                size: "18px",
              },
              {
                type: "text",
                text: `รหัส ${data.ncb_id}`,
                color: "#ffffff",
                size: "18px",
              },
            ],
            position: "absolute",
            spacing: "xs",
            paddingStart: "20%",
            width: "100%",
            offsetTop: "15%",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "N",
                    color: "#ffffff",
                    size: "12px",
                    weight: "bold",
                    align: "center",
                    margin: "sm",
                  },
                ],
                width: "25px",
                height: "25px",
                position: "absolute",
                backgroundColor: "#EC3D44",
                cornerRadius: "xxl",
                offsetStart: "90%",
                offsetTop: "15px",
              },
            ],
            width: "100%",
            position: "absolute",
            height: "50px",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "รายละเอียดคำขอ",
                  uri: `https://api-dev.icondigitalgateway.com?line_id=${data.line_id}&nac_id=${data.ncb_id}`,
                },
                style: "link",
                color: "#000000",
                gravity: "center",
                height: "sm",
              },
            ],
            position: "absolute",
            offsetStart: "20%",
            backgroundColor: "#27AE60",
            cornerRadius: "md",
            width: "50%",
            height: "40px",
            background: {
              type: "linearGradient",
              startColor: "#D0D2D4",
              endColor: "#BFBEBF",
              centerColor: "#EEEEEE",
              angle: "180.69deg",
            },
            offsetBottom: "15%",
          },
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}

function messageNcbRequestedError(image: string, data: any) {
  let msg = {
    type: "flex",
    altText: "ขออภัยไม่สามารถดำเนินการต่อได้ กรุณาทำรายการใหม่อีกครั้ง",
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: image,
            aspectMode: "cover",
            aspectRatio: "20:10",
            size: "full",
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "ขออภัยไม่สามารถดำเนินการต่อได้",
                "wrap": true,
                "color": "#0FFF73",
                "size": "20px",
                "weight": "bold"
              },
              {
                "type": "text",
                "text": "กรุณาทำรายการใหม่อีกครั้ง",
                "color": "#0FFF73",
                "size": "20px",
                "weight": "bold",
                "wrap": true,
                "offsetTop": "md"
              },
              {
                "type": "text",
                "text": `ReferenceID: ${data.ncb_id}`,
                "color": "#FFFFFF",
                "size": "17px",
                "weight": "bold",
                "wrap": true,
                "offsetTop": "xxl"
              }
            ],
            "position": "absolute",
            "spacing": "xs",
            "paddingAll": "10%",
            "offsetTop": "md"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "text",
                    "text": "N",
                    "color": "#ffffff",
                    "size": "12px",
                    "weight": "bold",
                    "align": "center",
                    "margin": "sm"
                  }
                ],
                "width": "25px",
                "height": "25px",
                "position": "absolute",
                "backgroundColor": "#EC3D44",
                "cornerRadius": "xxl",
                "offsetStart": "90%",
                "offsetTop": "15px"
              }
            ],
            "width": "100%",
            "position": "absolute",
            "height": "50px"
          }
        ],
        paddingAll: "0px",
      },
    },
  };
  return msg;
}
