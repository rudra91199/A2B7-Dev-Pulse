import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import config from "../../config/config";
import type { IUser } from "./auth.interface";

const signup = async (payload: IUser) => {
  const { name, email, password, role = "contributor" } = payload;

  if (role !== "contributor" && role !== "maintainer") {
    throw new Error("Role doesnt match the interface");
  }

  const hashPassword = await bcrypt.hash(password as string, 10);

  const result = await pool.query(
    `
        INSERT INTO users (name, email, password, role) 
        VALUES ($1, $2, $3, $4) RETURNING *
    `,
    [name, email, hashPassword, role]
  );

  const user = result.rows[0];
  delete user.password;

  return user;
};

const login = async (payload: Pick<IUser, "email" | "password">) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }

  const matchPassword = await bcrypt.compare(password as string, userData.rows[0].password);

  if (!matchPassword) {
    throw new Error("Invalid password");
  }

  const validatedUser = userData.rows[0];

  // as per requirement of assignment, id included
  const jwtPayload = {
    id: validatedUser.id,
    name: validatedUser.name,
    email: validatedUser.email,
    role: validatedUser.role
  }; 

  const accessToken = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });

  delete validatedUser.password;

  //renaming to show the response as per requirement.
  return {token: accessToken, user:validatedUser };
};
 
export const AuthService = {
  signup,
  login,
};