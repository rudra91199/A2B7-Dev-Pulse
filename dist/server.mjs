
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/middlewares/globalErrorHandler.ts
var globalErrorHandler, globalErrorHandler_default;
var init_globalErrorHandler = __esm({
  "src/middlewares/globalErrorHandler.ts"() {
    "use strict";
    globalErrorHandler = (err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: err
      });
    };
    globalErrorHandler_default = globalErrorHandler;
  }
});

// src/config/config.ts
import path from "path";
import dotenv from "dotenv";
var config, config_default;
var init_config = __esm({
  "src/config/config.ts"() {
    "use strict";
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    config = {
      postgresUrl: process.env.POSTGRES_URL || "",
      port: process.env.PORT || 5e3,
      secret: process.env.JWT_SECRET,
      secretExpire: process.env.JWT_EXPIRY || "1d"
    };
    config_default = config;
  }
});

// src/db/index.ts
import { Pool } from "pg";
var pool, initDB;
var init_db = __esm({
  "src/db/index.ts"() {
    "use strict";
    init_config();
    pool = new Pool({
      connectionString: config_default.postgresUrl
    });
    initDB = async () => {
      try {
        await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(30),
    email VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'contributor',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    )
      `);
        await pool.query(`
    CREATE TABLE IF NOT EXISTS issues(
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    reporter_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
      )
        `);
        console.log("Database Connected Succesfully");
      } catch (error) {
        console.error("Error creating table:", error);
      }
    };
  }
});

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var signup, login, AuthService;
var init_auth_service = __esm({
  "src/modules/auth/auth.service.ts"() {
    "use strict";
    init_db();
    init_config();
    signup = async (payload) => {
      const { name, email, password, role = "contributor" } = payload;
      if (role !== "contributor" && role !== "maintainer") {
        throw new Error("Role doesnt match the interface");
      }
      const hashPassword = await bcrypt.hash(password, 10);
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
    login = async (payload) => {
      const { email, password } = payload;
      const userData = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );
      if (userData.rows.length === 0) {
        throw new Error("User not found");
      }
      const matchPassword = await bcrypt.compare(password, userData.rows[0].password);
      if (!matchPassword) {
        throw new Error("Invalid password");
      }
      const validatedUser = userData.rows[0];
      const jwtPayload = {
        id: validatedUser.id,
        name: validatedUser.name,
        email: validatedUser.email,
        role: validatedUser.role
      };
      const accessToken = jwt.sign(jwtPayload, config_default.secret, {
        expiresIn: "1d"
      });
      delete validatedUser.password;
      return { token: accessToken, user: validatedUser };
    };
    AuthService = {
      signup,
      login
    };
  }
});

// src/utils/sendResponse.ts
var sendResponse, sendResponse_default;
var init_sendResponse = __esm({
  "src/utils/sendResponse.ts"() {
    "use strict";
    sendResponse = (res, data) => {
      res.status(data.statusCode).json({
        success: data.success,
        message: data.message,
        data: data.data
      });
    };
    sendResponse_default = sendResponse;
  }
});

// src/modules/auth/auth.controller.ts
var signup2, login2, AuthController;
var init_auth_controller = __esm({
  "src/modules/auth/auth.controller.ts"() {
    "use strict";
    init_auth_service();
    init_sendResponse();
    signup2 = async (req, res, next) => {
      try {
        const result = await AuthService.signup(req.body);
        sendResponse_default(res, {
          statusCode: 201,
          success: true,
          message: "User registered successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    login2 = async (req, res, next) => {
      try {
        const result = await AuthService.login(req.body);
        sendResponse_default(res, {
          statusCode: 200,
          success: true,
          message: "Login successful",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    AuthController = {
      signup: signup2,
      login: login2
    };
  }
});

// src/modules/auth/auth.route.ts
import { Router } from "express";
var router, authRoute;
var init_auth_route = __esm({
  "src/modules/auth/auth.route.ts"() {
    "use strict";
    init_auth_controller();
    router = Router();
    router.post("/signup", AuthController.signup);
    router.post("/login", AuthController.login);
    authRoute = router;
  }
});

// src/modules/issues/issues.service.ts
var createIssue, getAllIssues, getIssueById, updateIssue, deleteIssue, IssuesService;
var init_issues_service = __esm({
  "src/modules/issues/issues.service.ts"() {
    "use strict";
    init_db();
    createIssue = async (payload, reporter_id) => {
      const { title, description, type } = payload;
      if (type !== "bug" && type !== "feature_request") {
        throw new Error("Invalid Issue Type");
      }
      const result = await pool.query(
        `INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [title, description, type, reporter_id]
      );
      return result.rows[0];
    };
    getAllIssues = async (query) => {
      let issues = [];
      if (query.type && query.status) {
        const issuesResult = await pool.query(
          `SELECT * FROM issues WHERE type = $1 AND status = $2`,
          [query.type, query.status]
        );
        issues = issuesResult.rows;
      } else if (query.type) {
        const issuesResult = await pool.query(
          `SELECT * FROM issues WHERE type = $1`,
          [query.type]
        );
        issues = issuesResult.rows;
      } else if (query.status) {
        const issuesResult = await pool.query(
          `SELECT * FROM issues WHERE status = $1`,
          [query.status]
        );
        issues = issuesResult.rows;
      } else if (query.sort === "oldest") {
        const issuesResult = await pool.query(
          "SELECT * FROM issues ORDER BY created_at ASC"
        );
        issues = issuesResult.rows;
      } else {
        const issuesResult = await pool.query(
          "SELECT * FROM issues ORDER BY created_at DESC"
        );
        issues = issuesResult.rows;
      }
      const IssuesListWithReporter = [];
      for (let i = 0; i < issues.length; i++) {
        const currentIssue = issues[i];
        const userResult = await pool.query(
          `SELECT id, name, role FROM users WHERE id = $1`,
          [currentIssue.reporter_id]
        );
        const reporter = userResult.rows[0];
        const IssueWithReporter = {
          id: currentIssue.id,
          title: currentIssue.title,
          description: currentIssue.description,
          type: currentIssue.type,
          status: currentIssue.status,
          reporter,
          created_at: currentIssue.created_at,
          updated_at: currentIssue.updated_at
        };
        IssuesListWithReporter.push(IssueWithReporter);
      }
      return IssuesListWithReporter;
    };
    getIssueById = async (id) => {
      const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
        id
      ]);
      if (issueResult.rowCount === 0) throw new Error("Issue not found");
      const issue = issueResult.rows[0];
      const userResult = await pool.query(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [issue.reporter_id]
      );
      const reporter = userResult.rows[0];
      const IssueWithReporter = {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      };
      return IssueWithReporter;
    };
    updateIssue = async (id, payload, user) => {
      const existingResult = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [id]
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
        [payload.title, payload.description, payload.type, payload.status, id]
      );
      return result.rows[0];
    };
    deleteIssue = async (id) => {
      const result = await pool.query(
        `DELETE FROM issues WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rowCount === 0) throw new Error("Issue not found");
      return result.rows[0];
    };
    IssuesService = {
      createIssue,
      getAllIssues,
      getIssueById,
      updateIssue,
      deleteIssue
    };
  }
});

// src/modules/issues/issues.controller.ts
var createIssue2, getAllIssues2, getIssueById2, updateIssue2, deleteIssue2, IssuesController;
var init_issues_controller = __esm({
  "src/modules/issues/issues.controller.ts"() {
    "use strict";
    init_issues_service();
    init_sendResponse();
    createIssue2 = async (req, res, next) => {
      try {
        const reporter_id = req.user?.id;
        const result = await IssuesService.createIssue(req.body, reporter_id);
        sendResponse_default(res, {
          statusCode: 201,
          success: true,
          message: "Issue created successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    getAllIssues2 = async (req, res, next) => {
      try {
        const result = await IssuesService.getAllIssues(req.query);
        sendResponse_default(res, {
          statusCode: 200,
          success: true,
          message: "Issues retrieved successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    getIssueById2 = async (req, res, next) => {
      try {
        const result = await IssuesService.getIssueById(req.params.id);
        sendResponse_default(res, {
          statusCode: 200,
          success: true,
          message: "Issue retrieved successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    updateIssue2 = async (req, res, next) => {
      try {
        const result = await IssuesService.updateIssue(
          req.params.id,
          req.body,
          req.user
        );
        sendResponse_default(res, {
          statusCode: 200,
          success: true,
          message: "Issue updated successfully",
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    deleteIssue2 = async (req, res, next) => {
      try {
        await IssuesService.deleteIssue(req.params.id);
        sendResponse_default(res, {
          statusCode: 200,
          success: true,
          message: "Issue deleted successfully"
        });
      } catch (error) {
        next(error);
      }
    };
    IssuesController = {
      createIssue: createIssue2,
      getAllIssues: getAllIssues2,
      getIssueById: getIssueById2,
      updateIssue: updateIssue2,
      deleteIssue: deleteIssue2
    };
  }
});

// src/middlewares/auth.ts
import jwt2 from "jsonwebtoken";
var auth;
var init_auth = __esm({
  "src/middlewares/auth.ts"() {
    "use strict";
    init_config();
    init_db();
    auth = (...roles) => {
      return async (req, res, next) => {
        try {
          const token = req.headers.authorization;
          if (!token) {
            return res.status(401).json({
              success: false,
              message: "Unauthorized Access. No Token Came"
            });
          }
          const validatedUser = jwt2.verify(token, config_default.secret);
          const userData = await pool.query(
            `
        SELECT * FROM users WHERE email=$1
        `,
            [validatedUser.email]
          );
          if (userData.rowCount === 0) {
            return res.status(404).json({
              success: false,
              message: "User not found"
            });
          }
          if (roles.length > 0 && !roles.includes(validatedUser.role)) {
            return res.status(403).json({
              success: false,
              message: "Forbidden"
            });
          }
          req.user = validatedUser;
          next();
        } catch (error) {
          next(error);
        }
      };
    };
  }
});

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";
var router2, issuesRoute;
var init_issues_route = __esm({
  "src/modules/issues/issues.route.ts"() {
    "use strict";
    init_issues_controller();
    init_auth();
    router2 = Router2();
    router2.post("/", auth("contributor", "maintainer"), IssuesController.createIssue);
    router2.get("/", IssuesController.getAllIssues);
    router2.get("/:id", IssuesController.getIssueById);
    router2.put("/:id", auth("contributor", "maintainer"), IssuesController.updateIssue);
    router2.delete("/:id", auth("maintainer"), IssuesController.deleteIssue);
    issuesRoute = router2;
  }
});

// src/app.ts
import express from "express";
import cors from "cors";
var app, app_default;
var init_app = __esm({
  "src/app.ts"() {
    "use strict";
    init_globalErrorHandler();
    init_auth_route();
    init_issues_route();
    app = express();
    app.use(express.json());
    app.use(cors({
      origin: "http://localhost:5173"
      //assuming frontend with vite is working on this port
    }));
    app.use("/api/auth", authRoute);
    app.use("/api/issues", issuesRoute);
    app.get("/", (req, res) => {
      res.status(200).json(
        { message: "You are connected to Dev Pulse API, Instructor!" }
      );
    });
    app.use(globalErrorHandler_default);
    app_default = app;
  }
});

// src/server.ts
var require_server = __commonJS({
  "src/server.ts"() {
    init_app();
    init_config();
    init_db();
    var main = () => {
      initDB();
      app_default.listen(config_default.port, () => {
        console.log(`Dev pulse is running on ${config_default.port} port`);
      });
    };
    main();
  }
});
export default require_server();
//# sourceMappingURL=server.mjs.map