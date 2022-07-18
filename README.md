# How to use SQL - Create Article Services

## Description

This app is forked from <https://gitlab.com/fsw-23-binar-academy/article-sql> to implement Article Services include databases from users, articles, and comments.

## Installation

1. This App requires [Node.js v16+](https://nodejs.org/en/) and [PostgreSQL](https://www.postgresql.org/download/) to run.

2. Create new locally database on PostgreSQL with 3 tables: users, articles, and comments.

3. Clone this repository.

   ```sh
   git clone https://gitlab.com/binar-exercise-fsw23/how-to-use-sql-create-article-services
   ```

4. Mount the directory using terminal.

   ```sh
   cd how-to-use-sql-create-article-services
   ```

5. Install dependencies via terminal and your app will running default on PORT=3000

   ```sh
   npm install
   ```

6. Create `.env` file to handling database access with contents according to the example (see [.env.example](/.env.example)) or your database will running default on PORT=5432

7. Start this App via terminal

   ```sh
   npm run start
   ```

## Interaction with App

- Open this app on Postman <http://localhost:3000>

## Authors

Septian Maulana

## License

[MIT](/LICENSE.md) License
