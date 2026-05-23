import { pool } from "../../db";
import type { IIssue } from "./issues.interface";

const createIssue = async (payload: IIssue, reporter_id: number) => {
  const { title, description, type } = payload;

  if (type !== "bug" && type !== "feature_request") {
    throw new Error("Invalid Issue Type");
  }

  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, description, type, reporter_id],
  );
  return result.rows[0];
};

const getAllIssues = async (query: any) => {
  let issues = [];

  if (query.type && query.status) {
    const issuesResult = await pool.query(
      `SELECT * FROM issues WHERE type = $1 AND status = $2`,
      [query.type, query.status],
    );
    issues = issuesResult.rows;
  } else if (query.type) {
    const issuesResult = await pool.query(
      `SELECT * FROM issues WHERE type = $1`,
      [query.type],
    );
    issues = issuesResult.rows;
  } else if (query.status) {
    const issuesResult = await pool.query(
      `SELECT * FROM issues WHERE status = $1`,
      [query.status],
    );
    issues = issuesResult.rows;
  } else if (query.sort === "oldest") {
    const issuesResult = await pool.query(
      "SELECT * FROM issues ORDER BY created_at ASC",
    );
    issues = issuesResult.rows;
  } else {
    const issuesResult = await pool.query(
      "SELECT * FROM issues ORDER BY created_at DESC",
    );
    issues = issuesResult.rows;
  }

  const IssuesListWithReporter = [];

  for (let i = 0; i < issues.length; i++) {
    const currentIssue = issues[i];

    const userResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = $1`,
      [currentIssue.reporter_id],
    );

    const reporter = userResult.rows[0];

    //formatting this for getting the exact requirement format of issue
    const IssueWithReporter = {
      id: currentIssue.id,
      title: currentIssue.title,
      description: currentIssue.description,
      type: currentIssue.type,
      status: currentIssue.status,
      created_at: currentIssue.created_at,
      updated_at: currentIssue.updated_at,
      reporter: reporter,
    };

    IssuesListWithReporter.push(IssueWithReporter);
  }

  return IssuesListWithReporter;
};

export const IssuesService = {
  createIssue,
  getAllIssues,
};
