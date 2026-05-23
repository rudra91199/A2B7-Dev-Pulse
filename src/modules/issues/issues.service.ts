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
      reporter: reporter,
      created_at: currentIssue.created_at,
      updated_at: currentIssue.updated_at,
    };

    IssuesListWithReporter.push(IssueWithReporter);
  }

  return IssuesListWithReporter;
};

const getIssueById = async (id: string) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (issueResult.rowCount === 0) throw new Error("Issue not found");

  const issue = issueResult.rows[0];

  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );

  const reporter = userResult.rows[0];

  const IssueWithReporter = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return IssueWithReporter;
};

const updateIssue = async (id: string, payload: Partial<IIssue>, user: any) => {
  const existingResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id],
  );
  if (existingResult.rowCount === 0) throw new Error("Issue not found");

  const issue = existingResult.rows[0];

  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("Forbidden: You can only edit your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("Conflict: Cannot edit issues that are not open");
    }
  }

  const result = await pool.query(
    `UPDATE issues SET 
     title = COALESCE($1, title), 
     description = COALESCE($2, description), 
     type = COALESCE($3, type), 
     status = COALESCE($4, status), 
     updated_at = NOW() 
     WHERE id = $5 RETURNING *`,
    [payload.title, payload.description, payload.type, payload.status, id],
  );

  return result.rows[0];
};

const deleteIssue = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id],
  );
  if (result.rowCount === 0) throw new Error("Issue not found");
  return result.rows[0];
};

export const IssuesService = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};
