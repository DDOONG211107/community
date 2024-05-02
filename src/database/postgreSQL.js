// require("dotenv").config(); // 이걸 server.js에 등록해도 나머지 모듈에도 전부 적용이 된다
const { Pool } = require("pg");

const psqlClient = {
  user: process.env.PSQL_DB_USER,
  password: process.env.PSQL_DB_PASSWORD,
  host: process.env.PSQL_DB_HOST,
  database: process.env.PSQL_DB_DATABASE,
  port: 5432, // 고정된 포트
};

const psqlPoolClient = {
  user: process.env.PSQL_DB_USER,
  password: process.env.PSQL_DB_PASSWORD,
  host: process.env.PSQL_DB_HOST,
  database: process.env.PSQL_DB_DATABASE,
  port: 5432, // 고정된 포트
  min: 20,
  max: 100,
};

const pgPool = new Pool(psqlPoolClient);

module.exports = { psqlClient, psqlPoolClient, pgPool };
