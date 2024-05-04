const { pgPool } = require("../database/postgreSQL");
const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");

const checkId = wrapper(async (req, res, next) => {
  const { accountIdx } = req.session;
  const { id } = req.body;

  const selectResult = await pgPool.query(
    "SELECT * FROM account.list WHERE id = $1",
    [id]
  );

  if (selectResult.rows.length == 1 && selectResult.rows[0].idx != accountIdx) {
    throw new Exception(409, "서버: 해당 아이디 중복. 사용 불가");
  }
  next();
});

module.exports = { checkId };
