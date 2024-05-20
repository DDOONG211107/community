const { pgPool } = require("../database/postgreSQL");
const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6380 });

const checkEmail = wrapper(async (req, res, next) => {
  // 세션 추출
  await redisClient.connect();
  const session = req.cookies.session;
  const sessionData = await redisClient.hGet("redisSession", session);
  const sessionObject = JSON.parse(sessionData);
  await redisClient.disconnect();

  const accountIdx = sessionObject?.accountIdx || 0;
  const { email } = req.body;

  const selectResult = await pgPool.query(
    "SELECT * FROM account.list WHERE email = $1",
    [email]
  );

  if (selectResult.rows.length == 1 && selectResult.rows[0].idx != accountIdx) {
    throw new Exception(409, "서버: 해당 이메일 중복. 사용불가");
  }
  next();
});

module.exports = { checkEmail };
