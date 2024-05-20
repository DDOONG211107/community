const router = require("express").Router();
const mongoConnection = require("../database/mongoDB");
const wrapper = require("../module/wrapper");
const { checkIsAdmin } = require("../middleware/checkIsAdmin");
const { StartDate, EndDate, Id, validate } = require("../middleware/validate");
const result = require("../module/result");
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6380 });

router.get(
  "/log",
  [Id, StartDate, EndDate, validate], // desc도 들어가야 함 (아직 안 함)
  checkIsAdmin,
  wrapper(async (req, res, next) => {
    // string, string, 2000-01-01T00:00:00, 2000-01-01T00:00:00
    const { desc, id, startDateString, endDateString } = req.body;

    // 여기에 이제 검색어부터 redis에 저장하기
    await redisClient.connect();
    console.log(Date.now());
    console.log(id);

    // 억지로 스코어를 음수로 바꿈
    await redisClient.zAdd(`recentWords_${req.cookies.accountIdx}`, {
      score: -Date.now(),
      value: id,
    });
    await redisClient.disconnect();

    // redis 끝

    let sort = 0;

    const startDate = new Date(
      startDateString ? startDateString : "2024-01-01T00:00:00"
    );
    const endDate = new Date(
      endDateString ? endDateString : "2099-12-31T00:00:00"
    );

    // 내림차순으로 정렬해야 함
    if (desc === "true") {
      sort = -1;
      // 오름차순으로 정렬해야 함
    } else if (desc === "false") {
      sort = 1;
    }

    const mongoClient = await mongoConnection();
    const logCollection = mongoClient
      .db(process.env.MONGO_DB_DATABASE)
      .collection("log");

    const logArr = await logCollection
      .find({
        accountId: { $regex: id, $options: "i" },
        createdAt: { $gt: startDate, $lt: endDate },
      })
      .limit(5)
      .sort({ createdAt: sort })
      .toArray();

    req.code = 200;
    req.result = result(logArr);
    res.status(200).send(req.result);
  })
);

router.get(
  "/today-users",
  checkIsAdmin,
  wrapper(async (req, res, next) => {
    await redisClient.connect();
    const today = await redisClient.bitCount("todayUsers_bit");
    await redisClient.disconnect();

    req.code = 200;
    req.result = result({ today: today });
    res.status(200).send(req.result);
  })
);

router.get(
  "/recent-words",
  checkIsAdmin,
  wrapper(async (req, res) => {
    await redisClient.connect();

    const words = await redisClient.zRange(
      `recentWords_${req.cookies.accountIdx}`,
      0,
      4
    ); // 5개를 가져온다는 뜻
    await redisClient.disconnect();

    req.code = 200;
    req.result = result(words);
    res.status(req.code).send(req.result);
  })
);

module.exports = router;
