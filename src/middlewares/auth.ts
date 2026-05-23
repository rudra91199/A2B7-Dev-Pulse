import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config/config";

export const auth = (...roles: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized Access. No Token Came",
        });
      }

      let validatedUser: JwtPayload | null = null;

      validatedUser = jwt.verify(token, config.secret as string) as JwtPayload;

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

      if (!userData.rows[0].is_active) {
        return res.status(403).json({
          success: false,
          message: "User is not active",
        });
      }

      if (role.length > 0 && !role.includes(validatedUser.role)) {
        res.status(403).json({
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
