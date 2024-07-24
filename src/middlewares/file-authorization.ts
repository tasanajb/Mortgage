import { NextFunction, Request, Response } from "express";
import { createRequest } from "../config";
import crypto from "crypto";

export const encryptionFileIdentifier = async (file_id: string) => {
  let encrypted_file: string = "";
  if (file_id != null) {
    const algorithm = "aes-256-cbc";
    const cipher = crypto.createCipheriv(
      algorithm,
      process.env.FILE_SECRET_KEY,
      process.env.FILE_PLUBIC_KEY
    );
    encrypted_file = cipher.update(file_id, "utf-8", "hex");
    encrypted_file += cipher.final("hex");
  }
  return encrypted_file;
};

export const decryptionFileIdentifier = async (file_id: string) => {
    let decrypted_file: string = "";
    try {
        if (file_id != null) {
          const algorithm = "aes-256-cbc";
          const decipher = crypto.createDecipheriv(
            algorithm,
            process.env.FILE_SECRET_KEY,
            process.env.FILE_PLUBIC_KEY
          );
          decrypted_file = decipher.update(file_id, "hex", "utf-8");
          decrypted_file += decipher.final("utf8");
        }
        return decrypted_file;
    } catch (error) {
        return decrypted_file
    }
};
