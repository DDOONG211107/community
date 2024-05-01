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
  req.result = result;
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
      req.code = 409;
      next({ code: 409 });
    } else if (
      data.rows.length == 0 ||
      (data.rows.length == 1 && data.rows[0].idx == accountIdx)
    ) {
      next();
    }
  } catch (err) {
    if (client) {
      client.release();
    }
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next(err);
  }
};

module.exports = { checkEmail };
