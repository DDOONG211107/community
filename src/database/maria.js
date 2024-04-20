// require("dotenv").config();
const maria = require("mysql");

const connection = maria.createConnection({
  host: "127.0.0.1",
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

module.exports = connection;
