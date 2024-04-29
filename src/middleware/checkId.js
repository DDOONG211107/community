const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");

const checkId = async (req, res, next) => {
  const { accountIdx } = req.session;
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

    if (data.rows.length == 1 && data.rows[0].idx != accountIdx) {
      const log = {
        accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
        name: "middleware/checkId",
        rest: undefined,
        createdAt: new Date(),
        reqParams: req.params,
        reqBody: req.body,
        result: result,
        code: 409,
      };
      result.message = "서버: 해당 id 중복. 사용불가";
      res.log = log;

      return res.status(409).send(result);
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
    next({
      name: "middleware/checkEmail",
      rest: undefined,
      code: err.code,
      message: err.message,
      result: result,
    });
  }
};

module.exports = { checkId };
