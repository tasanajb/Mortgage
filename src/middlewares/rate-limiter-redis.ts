import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextFunction, Request, Response } from "express";
import {
  Transaction_Sms_Otp,
  Transaction_Email_Otp,
  Log_Api,
} from "../dbclass";
import { createRequest } from "../config";

const rateLimiterRequestSmsOtp = new RateLimiterMemory({
  points: 2, // 2 requests
  duration: 60, // per 60 second by IP
  blockDuration: 60, // Block for 60 second, if 2 wrong attempts per 60 second
});

const rateLimiterRequestEmailOtp = new RateLimiterMemory({
  points: 2, // 2 requests
  duration: 60, // per 60 second by IP
  blockDuration: 60, // Block for 60 second, if 2 wrong attempts per 60 second
});

const rateLimiterRequestPin = new RateLimiterMemory({
  points: 2, // 2 requests
  duration: 60, // per 60 second by IP
  blockDuration: 60, // Block for 60 second, if 2 wrong attempts per 60 second
});

const rateLimiterVerifySmsOtp = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60, // per 60 second by IP
  blockDuration: 30, // Block for 30 second, if 5 wrong attempts per 30 second
});

const rateLimiterVerifyEmailOtp = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60, // per 60 second by IP
  blockDuration: 30, // Block for 30 second, if 5 wrong attempts per 30 second
});

const rateLimiterVerifyPin = new RateLimiterMemory({
  points: 3, // 3 requests
  duration: 60, // per 0 second by IP
  blockDuration: 30, // Block for 30 second, if 5 wrong attempts per 30 second
});

export const requestSmsOtp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiterRequestSmsOtp
    .consume(req.body.line_id, 1)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rejRes) => {
      Log_Api.insert(createRequest(), {
        type: "inbound",
        method: req.method,
        header: "Rate limiter",
        origin: req.url,
        body: JSON.stringify({ ip: req.ip, ...req.body }),
      });
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));
      res.status(429).send({
        status: 429,
        message:
          "ขออภัย ไม่สามารถขอรหัส OTP ใหม่ได้ กรุณารอ " + secs + " วินาที.",
      });
    });
};

export const requestEmailOtp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiterRequestEmailOtp
    .consume(req.body.line_id, 1)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rejRes) => {
      Log_Api.insert(createRequest(), {
        type: "inbound",
        method: req.method,
        header: "Rate limiter",
        origin: req.url,
        body: JSON.stringify({ ip: req.ip, ...req.body }),
      });
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));
      res.status(429).send({
        status: 429,
        message:
          "ขออภัย ไม่สามารถขอรหัส OTP ใหม่ได้ กรุณารอ " + secs + " วินาที.",
      });
    });
};

export const requestPin = (req: Request, res: Response, next: NextFunction) => {
  rateLimiterRequestPin
    .consume(req.body.line_id, 1)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rejRes) => {
      Log_Api.insert(createRequest(), {
        type: "inbound",
        method: req.method,
        header: "Rate limiter",
        origin: req.url,
        body: JSON.stringify({ ip: req.ip, ...req.body }),
      });
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));
      res.status(429).send({
        status: 429,
        message: "ขออภัย ไม่สามารถขอรหัสใหม่ได้ กรุณารอ " + secs + " วินาที.",
      });
    });
};

export const verifySmsOtp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiterVerifySmsOtp
    .consume(req.body.token, 1)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rejRes) => {
      Log_Api.insert(createRequest(), {
        type: "inbound",
        method: req.method,
        header: "Rate limiter",
        origin: req.url,
        body: JSON.stringify({ ip: req.ip, ...req.body }),
      });
      Transaction_Sms_Otp.update(
        createRequest(),
        {
          status: "deactive",
          expied_date: new Date(),
        },
        {
          token: req.body.token,
          status: "pending",
        }
      );
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));
      res.status(429).send({
        status: 429,
        message:
          "ท่านระบุรหัส OTP ไม่ถูกต้อง กรุณาขอ OTP ใหม่อีกครั้ง (ท่านสามารถระบุรหัส OTP ได้ 5 ครั้ง)",
      });
    });
};

export const verifyEmailOtp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiterVerifyEmailOtp
    .consume(req.body.token, 1)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rejRes) => {
      Log_Api.insert(createRequest(), {
        type: "inbound",
        method: req.method,
        header: "Rate limiter",
        origin: req.url,
        body: JSON.stringify({ ip: req.ip, ...req.body }),
      });
      Transaction_Email_Otp.update(
        createRequest(),
        {
          status: "deactive",
          expied_date: new Date(),
        },
        {
          token: req.body.token,
          status: "pending",
        }
      );
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));
      res.status(429).send({
        status: 429,
        message:
          "ท่านระบุรหัส OTP ไม่ถูกต้อง กรุณาขอ OTP ใหม่อีกครั้ง (ท่านสามารถระบุรหัส OTP ได้ 5 ครั้ง)",
      });
    });
};

export const verifyPin = (req: Request, res: Response, next: NextFunction) => {
  rateLimiterVerifyPin
    .consume(req.body.token, 1)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rejRes) => {
      Log_Api.insert(createRequest(), {
        type: "inbound",
        method: req.method,
        header: "Rate limiter",
        origin: req.url,
        body: JSON.stringify({ ip: req.ip, ...req.body }),
      });
      Transaction_Email_Otp.update(
        createRequest(),
        {
          status: "deactive",
          expied_date: new Date(),
        },
        {
          token: req.body.token,
          status: "pending",
        }
      );
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));
      res.status(429).send({
        status: 429,
        message:
          "ท่านระบุรหัสไม่ถูกต้อง กรุณาขอรหัสใหม่อีกครั้ง (ท่านสามารถระบุรหัสได้ 3 ครั้ง)",
      });
    });
};
