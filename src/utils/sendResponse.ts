import type { Response} from "express";
import type { TResponse } from "../types/responseType";

const sendResponse = <T>(res:Response,data:TResponse<T>)=>{
    res.status(data.statusCode).json({
        success: data.success,
        message: data.message,
        data: data.data
    })
}

export default sendResponse;