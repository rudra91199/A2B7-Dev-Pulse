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
  let sql = "";
  const params: string[] = [];

  console.log(query);

  if (query.type) {
    params.push(query.type);
    sql = `SELECT * FROM issues WHERE 1=1 AND type = $${params.length}`;
  }
  if (query.status) {
    params.push(query.status);
    sql += `SELECT * FROM issues WHERE 1=1 AND status = $${params.length}`;
  }

  if (query.sort === "oldest") {
    sql += "SELECT * FROM issues WHERE 1=1 ORDER BY created_at ASC";
  } else {
    sql += "SELECT * FROM issues WHERE 1=1 ORDER BY created_at DESC";
  }

  const issuesResult = await pool.query(sql, params);
  const issues = issuesResult.rows;

  const finalIssuesList = [];

  for (let i = 0; i < issues.length; i++) {
    const currentIssue = issues[i];

    const userResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = $1`,
      [currentIssue.reporter_id],
    );

    const reporter = userResult.rows[0];

    const IssueWithReporter = {
      ...currentIssue,
      reporter:{...reporter},
    };

    finalIssuesList.push(IssueWithReporter);
  }

  return finalIssuesList;
};

export const IssuesService = {
  createIssue,
  getAllIssues,
};
