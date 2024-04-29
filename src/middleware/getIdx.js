const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");

const getIdx = async (req, res, next) => {
  const { id } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE id = $1";
    const values = [id];
    const data = await client.query(sql, values);
    client.release();

    // 존재하지 않는 id를 입력했다는 뜻
    if (data.rows.length == 0) {
      req.search_accountIdx = -1;

      // 존재하는 id를 입력했다는 뜻
    } else if (data.rows.length == 1) {
      req.search_accountIdx = data.rows[0].idx;
      console.log(req.search_accountIdx);
    }

    next();
  } catch (err) {
    if (client) {
      client.release();
    }

    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "middleware/getIdx",
      rest: undefined,
      code: err.code,
      message: err.message,
      result: result,
    });
  }
};

module.exports = { getIdx };
