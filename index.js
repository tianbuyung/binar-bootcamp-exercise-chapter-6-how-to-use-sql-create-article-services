const express = require("express");
const app = express();
var bodyParser = require("body-parser");
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "testing_database",
  password: "123456",
  port: 5432,
});

app.get("/insert", (req, res) => {
  pool.query(
    `insert into accounts (username, email, password) values ('riky', 'riky@gmail.com', 'password')`,
    (err, response) => {
      console.log("err", err);
      console.log("response", response);
      res.json({
        message: "Succesfully insert new data",
      });
    }
  );
});

app.get("/", (req, res) => {
  //   pool.query("SELECT * from accounts", (err, response) => {
  //     console.log(response.rows);
  //   });
  pool.query("select username, email from accounts", (err, response) => {
    console.log("er", err);
    if (!err) {
      res.json({
        data: response.rows,
      });
    } else {
      res.json({
        err,
        message: "error",
      });
    }
  });
});

app.get("/users", (req, res) => {
  let query = `select username, email, created_at from users`;
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

app.get("/articles", (req, res) => {
  let query = `
  SELECT
  articles.id, articles.title, articles.body, users.username as author, users.email as contact_author
  FROM articles
    JOIN users
        ON articles.user_id = users.id
  WHERE articles.deleted_at is null
  ORDER BY id ASC
  ;  
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
        message: "Get All Articles",
      });
    }
  });
});

app.get("/articles/:id", (req, res) => {
  let query = `
  SELECT
  articles.id, articles.title, articles.body, users.username as author, users.email as contact_author
  FROM articles
    JOIN users
        ON articles.user_id = users.id
        where articles.id = ${req.params.id} and articles.deleted_at is null;  
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
        message: "Get All Articles",
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
  let values = [req.body.title, req.body.body, false, req.headers.user_id];
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

app.put("/articles/:id", (req, res) => {
  let query = `
  UPDATE articles
  SET 
  title = $1,
  body = $2,
  updated_at = $3
  where id = $4;
  `;
  let values = [req.body.title, req.body.body, new Date(), req.params.id];
  pool.query(query, values, (err, _) => {
    if (err) {
      res.status(500).json({
        message: "Some error happen",
        err,
      });
    } else {
      res.status(200).json({
        message: "succesfully update data",
      });
    }
  });
});

app.delete("/articles/:id", (req, res) => {
  let query = `
  UPDATE articles
  SET
  deleted_at = $1
  where id = $2;
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
        message: "succesfully update data",
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