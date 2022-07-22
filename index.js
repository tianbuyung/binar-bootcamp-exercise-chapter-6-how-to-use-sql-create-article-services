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
  SELECT a.id, a.title, a.body, a.created_at, a.updated_at, u.username AS author, u.email AS author_email, c.comment_body, c.user_id
  FROM articles a
    JOIN users u
        ON a.user_id = u.id
          FULL JOIN comments c
            ON c.article_id = a.id
  WHERE a.deleted_at IS null
  ORDER BY id ASC 
  `;
  pool.query(query, (err, response) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      const articles = response.rows;
      const groupedArticles = groupedArticlesData(articles);
      res.status(200).json({
        message: "Get All Articles",
        data: groupedArticles,
      });
    }
  });
});

app.get("/articles/:id", (req, res) => {
  let query = `
  SELECT a.id, a.title, a.body, a.created_at, a.updated_at, u.username AS author, u.email AS author_email, c.comment_body, c.user_id
  FROM articles a
    JOIN users u
        ON a.user_id = u.id
          FULL JOIN comments c
            ON c.article_id = a.id
            WHERE a.id = ${req.params.id} AND a.deleted_at IS null
  `;
  pool.query(query, (err, response) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      const articles = response.rows;
      const groupedArticles = groupedArticlesData(articles);
      // console.log(groupedArticles);
      res.status(200).json({
        message: "Get a Article by ID",
        data: groupedArticles,
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
        message: "Succesfully update article",
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

const portApi = process.env.PORTAPI || 3000;

app.listen(portApi, () => {
  console.log(`This app listening at http://localhost:${portApi}`);
});

let groupedArticlesData = (data) => {
  // console.log(data);
  let result = Object.entries(
    // What you have done
    data.reduce(
      (
        acc,
        {
          id,
          title,
          body,
          created_at,
          updated_at,
          author,
          author_email,
          comment_body,
          user_id,
        }
      ) => {
        // Group initialization
        if (!acc[id]) {
          acc[id] = [];
        }

        // Grouping
        // FIX: only pushing the object that contains id and value
        acc[id].push({
          comment_body,
          title,
          body,
          created_at,
          updated_at,
          author,
          author_email,
          comment_body,
          user_id,
        });

        return acc;
      },
      {}
    )
  ).map(([id, data]) => {
    const obj = {
      id,
      title: data[0].title,
      body: data[0].body,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at,
      author: data[0].author,
      author_email: data[0].author_email,
      comments: data.map((d) => ({
        comment_body: d.comment_body,
        user_id: d.user_id,
      })),
    };
    return obj;
  });
  return result;
};
