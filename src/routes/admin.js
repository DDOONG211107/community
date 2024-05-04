const router = require("express").Router();
const mongoConnection = require("../database/mongoDB");
const wrapper = require("../module/wrapper");
const { checkIsAdmin } = require("../middleware/checkIsAdmin");
const { StartDate, EndDate, Id, validate } = require("../middleware/validate");
const result = require("../module/result");

router.get(
  "/log",
  [Id, StartDate, EndDate, validate], // desc도 들어가야 함 (아직 안 함)
  checkIsAdmin,
  wrapper(async (req, res, next) => {
    // string, string, 2000-01-01T00:00:00, 2000-01-01T00:00:00
    const { desc, id, startDateString, endDateString } = req.body;

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

module.exports = router;
