import express from "express";
import externals from "./externals";
import internals from "./internals";
import * as files from "./file";
import { withAuthenForToken, withAuthenParms } from "../middlewares/with-authen";
import multer from "multer";
import { callback , notitest} from "./ndid";
const app = express.Router();

// api
app.use("/externals", externals);
app.use("/internals", internals);

//upload file
export const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});
app.post("/files", withAuthenForToken, upload.any(), files.uploadFile);
app.get("/files/:id", withAuthenForToken, files.getFile);
app.post("/files/:id/remove", withAuthenForToken, files.removeFile);
//app.post("/files/remove/all", withAuthen, files.removeFileInBlobs); //กวาดรูปไฟล์ทุกไฟล์ที่ไม่มี ref_id

//ndid call back
app.post("/ndid/callback", callback);

//ใช้สำหรับทดสอบ noti ncb success
//app.post("/noti", notitest);

export default app;
