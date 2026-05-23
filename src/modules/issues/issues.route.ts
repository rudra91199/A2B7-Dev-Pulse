import { Router } from "express";
import { IssuesController } from "./issues.controller";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post("/", auth("contributor", "maintainer"), IssuesController.createIssue);
router.get("/", IssuesController.getAllIssues);
router.get("/:id", IssuesController.getIssueById);

export const issuesRoute = router;