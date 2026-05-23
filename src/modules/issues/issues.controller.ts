import type { Request, Response, NextFunction } from "express";
import { IssuesService } from "./issues.service";
import sendResponse from "../../utils/sendResponse";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reporter_id = req.user?.id;
    const result = await IssuesService.createIssue(req.body, reporter_id);
    sendResponse(res, { statusCode: 201, success: true, message: "Issue created successfully", data: result });
  } catch (error) { next(error); }
};

export const IssuesController = {
  createIssue,
};