const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const logger = require("morgan");
require("dotenv").config();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.USER || "postgres",
  host: process.env.HOST || "localhost",
  database: process.env.DATABASE || "testing_database",
  password: process.env.PASSWORD || "123456",
  port: process.env.PORT || 5432,
});
app.use(logger("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "This Rest API App is ready, please open via postman!",
  });
});

// app.get("/insert", (req, res) => {
//   pool.query(
//     `insert into accounts (username, email, password) values ('riky', 'riky@gmail.com', 'password')`,
//     (err, response) => {
//       console.log("err", err);
//       console.log("response", response);
//       res.json({
//         message: "Succesfully insert new data",
//       });
//     }
//   );
// });

// app.get("/", (req, res) => {
//   //   pool.query("SELECT * from accounts", (err, response) => {
//   //     console.log(response.rows);
//   //   });
//   pool.query("select username, email from accounts", (err, response) => {
//     console.log("er", err);
//     if (!err) {
//       res.json({
//         data: response.rows,
//       });
//     } else {
//       res.json({
//         err,
//         message: "error",
//       });
//     }
//   });
// });

app.post("/users", (req, res) => {
  let query = `
  INSERT INTO users
  (username, password, email)
  VALUES
  ($1, $2, $3)
  `;
  let values = [req.body.username, req.body.password, req.body.email];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "succesfully created new user",
      });
    }
  });
});

app.get("/users", (req, res) => {
  let query = `
  SELECT JSON_AGG(data ORDER BY id)
  FROM(
    SELECT u.id, u.username, u.email, (
      SELECT JSON_AGG(a)
      FROM (
        SELECT a.id AS article_id, a.title, a.body, a.created_at, a.updated_at, (
          SELECT JSON_AGG(c)
          FROM (
            SELECT c.comment_body, c.user_id, c.created_at
            FROM comments c
            WHERE a.id = c.article_id
          ) c
        ) AS comments
        FROM articles a
        WHERE a.user_id = u.id and a.deleted_at is null
      ) a
    ) AS articles
    FROM users u
    GROUP BY u.id, u.username, u.email, u.created_at
  ) data;
  `;
  pool.query(query, (err, response) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "Get All Users",
        data: response.rows,
      });
    }
  });
});

app.get("/users/:id", (req, res) => {
  let query = `SELECT id, username, email, created_at FROM users WHERE id = ${req.params.id}`;
  pool.query(query, (err, response) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "Get a User by ID",
        data: response.rows,
      });
    }
  });
});

app.post("/articles", (req, res) => {
  let query = `
  INSERT INTO articles
  (title, body, approved, user_id)
  VALUES
  ($1, $2, $3, $4)
  `;
  let values = [
    req.body.title,
    req.body.body,
    req.body.approved,
    req.headers.user_id,
  ];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "Succesfully created new article",
      });
    }
  });
});

app.get("/articles", (req, res) => {
  let query = `
  SELECT JSON_AGG(data ORDER BY id)
  FROM (
  SELECT a.id, a.title, a.body, a.created_at, a.updated_at, (
    SELECT JSON_AGG(u)
    FROM (
      SELECT u.username, u.email AS contact
      FROM users u
      WHERE a.user_id = u.id
    ) u
  ) AS author, (
    SELECT JSON_AGG(c)
    FROM (
      SELECT c.comment_body, c.user_id, c.created_at
      FROM comments c
      WHERE a.id = c.article_id
    ) c
  ) AS comments
  FROM articles a
  WHERE a.deleted_at is null
  GROUP BY a.id, a.title, a.body, a.created_at, a.updated_at
  ) data; 
  `;
  pool.query(query, (err, response) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "Get All Articles",
        data: response.rows,
      });
    }
  });
});

app.get("/articles/:id", (req, res) => {
  let query = `
  SELECT JSON_AGG(data ORDER BY id)
  FROM (
  SELECT a.id, a.title, a.body, a.created_at, a.updated_at, (
    SELECT JSON_AGG(u)
    FROM (
      SELECT u.username, u.email AS contact
      FROM users u
      WHERE a.user_id = u.id
    ) u
  ) AS author, (
    SELECT JSON_AGG(c)
    FROM (
      SELECT c.comment_body, c.user_id, c.created_at
      FROM comments c
      WHERE a.id = c.article_id
    ) c
  ) AS comments
  FROM articles a
  WHERE a.id = ${req.params.id} and a.deleted_at is null
  GROUP BY a.id, a.title, a.body, a.created_at, a.updated_at
  ) data; 
  `;
  pool.query(query, (err, response) => {
    console.log("err", err);
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        data: response.rows,
        message: "Get a Article by ID",
      });
    }
  });
});

app.put("/articles/:id", (req, res) => {
  let query = `
  UPDATE articles
  SET 
  title = $1,
  body = $2,
  approved = $3,
  updated_at = $4
  WHERE id = $5;
  `;
  let values = [
    req.body.title,
    req.body.body,
    req.body.approved,
    new Date(),
    req.params.id,
  ];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "succesfully update article",
      });
    }
  });
});

app.delete("/articles/:id", (req, res) => {
  let query = `
  UPDATE articles
  SET
  deleted_at = $1,
  "isDeleted" = false
  WHERE id = $2;
  `;
  let values = [new Date(), req.params.id];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "succesfully deleted article",
      });
    }
  });
});

app.post("/comments", (req, res) => {
  let query = `
  INSERT INTO comments
  (user_id, article_id, comment_body)
  VALUES
  ($1, $2, $3)
  `;
  let values = [
    req.headers.user_id,
    req.headers.article_id,
    req.body.comment_body,
  ];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "Succesfully created new comment",
        values,
      });
    }
  });
});

app.get("/comments", (req, res) => {
  let query = `SELECT id, comment_body, user_id, article_id, created_at, updated_at
  FROM comments
  WHERE comments.deleted_at is null
  `;
  pool.query(query, (err, response) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        data: response.rows,
      });
    }
  });
});

app.get("/comments/:id", (req, res) => {
  let query = `SELECT id, comment_body, user_id, article_id, created_at
  FROM comments
  WHERE id = ${req.params.id} and comments.deleted_at is null
  `;
  pool.query(query, (err, response) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        data: response.rows,
      });
    }
  });
});

app.put("/comments/:id", (req, res) => {
  let query = `
  UPDATE comments
  SET 
  comment_body = $1,
  updated_at = $2
  WHERE id = $3;
  `;
  let values = [req.body.comment_body, new Date(), req.params.id];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "succesfully update comment",
      });
    }
  });
});

app.delete("/comments/:id", (req, res) => {
  let query = `
  UPDATE comments
  SET
  deleted_at = $1,
  "isDeleted" = false
  WHERE id = $2;
  `;
  let values = [new Date(), req.params.id];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "succesfully deleted comment",
      });
    }
  });
});

// if (err) {
//   res.status(500).json({
//     message: "Some error happen",
//     err,
//   });
// } else {
//   res.status(200).json({
//     data: response.rows,
//   });
// }

app.listen(3000);
console.log(`This app listening at http://localhost:3000`);
