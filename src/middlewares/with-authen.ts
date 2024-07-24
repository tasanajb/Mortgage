import { NextFunction, Request, Response } from "express";
import jwt from "../utility/jwt";
import { createRequest, pool } from "../config";
import {
  Transaction_Customer_Login,
  Master_Customer,
} from "../dbclass";
import _ from "lodash";
import sql from "mssql";

export const withAuthen = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const check_token = await Transaction_Customer_Login.findOne(
        createRequest(),
        {
          token_id: token,
          status: "active",
        }
      );
      if (check_token) {
        const verify = jwt.verify(token, null) as any;

        if (verify && verify.customer_id) {
          const customer = (await Master_Customer.findOne(createRequest(), {
            customer_id: verify.customer_id,
          })) as Master_Customer;

          if (customer) {
            req.auth = _.omit(customer, [
              "password",
              "created_date",
              "modified_date",
              "status",
            ]) as Master_Customer;

            req.customer_id = req.auth.customer_id;
            req.line_id = verify.line_id;
            next();
          } else {
            throw new Error("ไม่พบข้อมูล");
          }
        } else {
          throw new Error("Token หมดอายุ");
        }
      } else {
        throw new Error("ไม่พบข้อมูล");
      }
    } else {
      throw new Error("ไม่มี token");
    }
  } catch (error) {
    res.status(401).send({status: 401, message: error.message, expired: true});
  }
};

export const withAuthenParms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.query.token
    ) {
      const token: any = req.query.token;
      const check_token = await Transaction_Customer_Login.findOne(
        createRequest(),
        {
          token_id: token,
          status: "active",
        }
      );
      if (check_token) {
        const verify = jwt.verify(token, null) as Master_Customer;

        if (verify && verify.customer_id) {
          const customer = (await Master_Customer.findOne(createRequest(), {
            customer_id: verify.customer_id,
          })) as Master_Customer;

          if (customer) {
            req.auth = _.omit(customer, [
              "password",
              "created_date",
              "modified_date",
              "status",
            ]) as Master_Customer;

            req.customer_id = req.auth.customer_id;
            next();
          } else {
            throw new Error("ไม่พบข้อมูล");
          }
        } else {
          throw new Error("Token หมดอายุ");
        }
      } else {
        throw new Error("ไม่พบข้อมูล");
      }
    } else {
      throw new Error("ไม่มี token");
    }
  } catch (error) {
    res.status(401).send({ status: 401, message: error.message });
  }
};

export const withAuthenForToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const check_token = await Transaction_Customer_Login.findOne(
        createRequest(),
        {
          token_id: token,
          status: "active",
        }
      );
      if (check_token) {
        const verify = jwt.verify(token, null) as any;

        if (verify) {
          const customer = await createRequest()
            .input("line_id", sql.NVarChar, verify.line_id)
            .query(`SELECT t1.CustomerId, t2.LineId, t2.LineName, t2.Status FROM Master_Customer t1 
                    INNER JOIN Mapping_Customer_Register t2 ON t1.CustomerId = t2.CustomerId
                    WHERE t2.Status = 'active' AND t2.LineId = @line_id
            `);
          
          if (customer) {
            req.customer_id = customer.recordset[0].CustomerId;
            req.line_id = verify.line_id;
            next();
          } else {
            throw new Error("ไม่พบข้อมูล");
          }
        } else {
          throw new Error("Token หมดอายุ");
        }
      } else {
        throw new Error("ไม่พบข้อมูล");
      }
    } else {
      throw new Error("ไม่มี token");
    }
  } catch (error) {
    res.status(401).send({ status: 401, message: error.message, expired: true });
  }
};
