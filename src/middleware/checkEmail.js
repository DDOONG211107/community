const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");

const checkEmail = async (req, res, next) => {
  const { accountIdx } = req.session;
  const { email } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };
  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();
    const sql = "SELECT * FROM account.list WHERE email = $1";
    const values = [email];
    const data = await client.query(sql, values);
    client.release();

    if (data.rows.length == 1 && data.rows[0].idx != accountIdx) {
      result.message = "서버: 해당 이메일 중복. 사용불가";
      res.status(409).send(result);
    } else if (
      data.rows.length == 0 ||
      (data.rows.length == 1 && data.rows[0].idx == accountIdx)
    ) {
      next();
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
};

module.exports = { checkEmail };
