require("dotenv").config(); // 이걸 server.js에 등록해도 나머지 모듈에도 전부 적용이 된다

const psqlClient = {
  user: process.env.PSQL_DB_USER,
  password: process.env.PSQL_DB_PASSWORD,
  host: process.env.PSQL_DB_HOST,
  database: process.env.PSQL_DB_DATABASE,
  port: 5432, // 고정된 포트
};

module.exports = psqlClient;
