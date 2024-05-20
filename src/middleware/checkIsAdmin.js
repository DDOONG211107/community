const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6380 });

const checkIsAdmin = wrapper(async (req, res, next) => {
  await redisClient.connect();
  const session = req.cookies.session;
  const sessionData = await redisClient.hGet("redisSession", session);
  const sessionObject = JSON.parse(sessionData);
  await redisClient.disconnect();

  const role = sessionObject?.role;

  if (role != 1) {
    throw new Exception(403, "관리자 권한 없음");
  }
  next();
});

module.exports = { checkIsAdmin };
