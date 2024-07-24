import express from "express";
import * as qouotation from "./quotation";
import * as ncb from "./ncb";
import * as loan from "./loan";
import * as interest from "./interest";
import * as ncbtest from "./ncb-test";
import * as dopa from "./dopa";
import * as matching from "./matching-sevice";
import { withAuthen } from "../../middlewares/with-authen";
const app = express.Router();

//API do pa check เลขบัตรประชาชน test
app.post("/dopa/verify-id-card", dopa.verifyIdCardApi);
app.post("/dopa/verify-chip-card", dopa.verifyChipCardApi);

//API NDID
app.post("/ncb/idps/check-status", withAuthen, ncb.checkIdPs);
app.post("/ncb/idps/close-request", withAuthen, ncb.closeRequestIdPs);
app.post("/ncb/services", withAuthen, ncb.services);
app.post("/ncb/as-services", withAuthen, ncb.asService);

//API NDID TEST
app.post("/ncb-test/token", ncbtest.getToken);
app.post("/ncb-test/token/error", ncbtest.getTokenError);
app.post("/ncb-test/idps", ncbtest.listIdPs);
app.post("/ncb-test/idps/verify", ncbtest.verifyIdPs);
app.post("/ncb-test/idps/check-status", ncbtest.checkIdPs);
app.post("/ncb-test/idps/close-request", ncbtest.closeRequestIdPs);
app.post("/ncb-test/services", ncbtest.services);
app.post("/ncb-test/as-services", ncbtest.asService);
app.post("/ncb-test/verify-request-data", ncbtest.verifyRequestData);
app.post("/ncb-test/verify-request-data/detail", ncbtest.getVerifyRequestData);

//API service matching
app.post("/matching-service/ncb/report", matching.ncbReportApi);

export default app;
