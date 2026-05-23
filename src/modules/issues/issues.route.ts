import { Router } from "express";
import { IssuesController } from "./issues.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post("/", auth("contributor", "maintainer"), IssuesController.createIssue);
router.get("/", IssuesController.getAllIssues);

export const issuesRoute = router;