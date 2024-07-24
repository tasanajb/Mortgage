import express from "express";
import apiRoutes from "./controllers";
import http from "http";
import dotenv from "dotenv";
import chalk from "chalk";
import { createPool, pool } from "./config";
import jwt from "./utility/jwt";
import helmet from "helmet";
import nocache from "nocache";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { HttpException } from "./models/HttpException";
import { logger } from "./utility";
import { Master_Customer } from "./dbclass";
import path from "path";
import sql from "mssql";

let started_time: Date;
// ENV
const env_result = dotenv.config();
if (env_result.error) {
  throw env_result.error;
}
const env = env_result.parsed;

declare global {
  namespace Express {
    interface Request {
      auth: Master_Customer;
      customer_id: string;
      line_id: string;
    }
  }
}

// JWT
jwt.setKeyFromPath((__dirname == "/" ? "" : __dirname) + "/keys");

const app = express();
// var whitelist = [
//   "http://localhost:4000",
//   "https://onlinesecuregateway.com",
//   "http://onlinesecuregateway.com",
//   "http://iconrem.com",
//   "https://icondigitalgateway.com",
//   "http://icondigitalgateway.com",
//   "https://digital-access.com",
//   "http://digital-access.com",
//   "http://10.1.0.4:5003",
//   "https://api.line.me"
// ];

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
};

app.use(helmet());
app.use(nocache());
app.use(cors(corsOptions));
app.disable("x-powered-by");
app.use(helmet.frameguard({ action: "sameorigin" }));
app.use(compression());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// STATIC
app.use("/api/statics", express.static(path.join(__dirname, "../public")));
app.use("/images", express.static("./images/"));

app.use(apiRoutes);

app.use(function (
  err: HttpException,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log(req.body);
  if (res.headersSent) {
    return next(err);
  }

  if (err.status && err.status < 500) {
    logger.info(err.message);
  } else {
    if (err.stack) {
      logger.error(err.stack);
    } else {
      logger.info(err.message);
    }
  }

  res.status(err.status || 500).send({
    error_code: err.status || 500,
    error_message: err.message || "System error, Something went wrong",
  });
});

// Process Setup
if (process.env.NODE_ENV === "production") {
  process.on("uncaughtException", function (er) {
    logger.error(er.stack);
    console.error(chalk.red(er.stack));
    process.exit(1);
  });
}

process.on("SIGINT", function () {
  if (pool) {
    pool.close((err) => {
      console.log(chalk.blueBright.inverse(`Pool release`));
      process.exit(err ? 1 : 0);
    });
  }
});

const configSql: sql.config = {
  server: process.env.DB_HOST as string,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME as string,
  requestTimeout: 30000,
  //connectionTimeout: 50000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false,
    rowCollectionOnDone: true,
    useUTC: false,
    enableArithAbort: true,
  },
};

// Start App
createPool(configSql)
  .then(() => {
    console.log(chalk.green.inverse(`Pool connected`));

    started_time = new Date();
    http.createServer(app).listen(env.PORT, () => {
      console.log(chalk.green.inverse(`Listening on port ${env.PORT}`));
    });

    http.createServer(app).setTimeout(30000);
  })
  .catch((err) => {
    console.log(chalk.red.inverse(`Pool connect error`), err);
  });
