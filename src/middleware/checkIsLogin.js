const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6380 });
// checkIsLogin으로 이름 바꾸는게 낫다
const checkIsLogin = wrapper(async (req, res, next) => {
  // 세션 추출
  await redisClient.connect();
  const session = req.cookies.session;
  const sessionData = await redisClient.hGet("redisSession", session);
  const sessionObject = JSON.parse(sessionData);
  await redisClient.disconnect();

  const accountIdx = sessionObject?.accountIdx;
  console.log(accountIdx);

  if (!accountIdx) {
    throw new Exception(403, "로그인 되어있지 않음");
  }
  next();
});

module.exports = { checkIsLogin };
