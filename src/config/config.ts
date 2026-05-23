import path from 'path';
import dotenv from 'dotenv';

dotenv.config({path: path.resolve(process.cwd(),".env")})

const config ={
    postgresUrl: process.env.POSTGRES_URL || "",
    port: process.env.PORT || 5000,
    secret: process.env.JWT_SECRET,
    secretExpire: process.env.JWT_EXPIRY || "1d",
}

export default config;