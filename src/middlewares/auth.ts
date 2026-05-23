import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config/config";
import { pool } from "../db";
import type { IUser } from "../modules/auth/auth.interface";

export const auth = (...roles: IUser["role"][]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized Access. No Token Came",
        });
      }

      const validatedUser = jwt.verify(token, config.secret as string) as JwtPayload;

      const userData = await pool.query(
        `
        SELECT * FROM users WHERE email=$1
        `,
        [validatedUser.email],
      );

      if (userData.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (roles.length > 0 && !roles.includes(validatedUser.role)) {
       return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      req.user = validatedUser;

      next();
    } catch (error) {
      next(error);
    }
  };
};
