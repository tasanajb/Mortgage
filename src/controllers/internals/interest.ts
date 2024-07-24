import axios from "axios";
import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { Log_Api, Master_Bank } from "../../dbclass";
import { createRequest, pool } from "../../config";
import { interestRateAll } from "../../controllers/externals/interest";

export const interestDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const interest_rate_all = await interestRateAll();
    if (interest_rate_all.status != 200) {
      throw interest_rate_all;
    }

    let interest_rate_data = interest_rate_all?.data || [];
    const get_bank = await Master_Bank.find(createRequest(), {});
    let interest_rate: any = [];
    for (var i in interest_rate_data) {
      let find_bank = _.find(get_bank, (n) => {
        if (n.bank_code === interest_rate_data[i].bank_code) {
          return true;
        }
      });

      interest_rate.push({
        ...interest_rate_data[i],
        bank_logo:
          find_bank.bank_logo != "" && find_bank.bank_logo != null
            ? process.env.URL + find_bank.bank_logo
            : process.env.URL + "/images/noimage.jpg",
      });
    }

    let master_bank = _.map(interest_rate, (n) => {
      const { bank_code, bank_name, interest_rate, bank_logo } = n;
      return {
        bank_code: bank_code,
        bank_name: bank_name,
        bank_logo: bank_logo,
        interest_rate: interest_rate,
      };
    });

    res.status(200).send({
      status: 200,
      message: "success",
      data: {
        interest: interest_rate,
        master: {
          bank: master_bank,
        },
      },
    });
  } catch (error) {
    await Log_Api.insert(createRequest(), {
      type: "inbound",
      method: "POST",
      origin: "/interest/detail",
      error_message: error?.message || "",
    });
    res.status(error?.status || 500).send({
      status: error?.status || 500,
      message: error?.message,
    });
  }
};

export const interestCalculate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
  } catch (error) {
    res.status(500).send({
      status: 500,
      message: error.message,
    });
  }
};
