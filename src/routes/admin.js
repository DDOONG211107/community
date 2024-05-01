const router = require("express").Router();
const { MongoClient } = require("mongodb");
const { checkIsAdmin } = require("../middleware/checkIsAdmin");
const { StartDate, EndDate, Id, validate } = require("../middleware/validate");

router.get(
  "/log",
  [Id, StartDate, EndDate, validate], // desc도 들어가야 함 (아직 안 함)
  checkIsAdmin,
  async (req, res, next) => {
    // string, string, 2000-01-01T00:00:00, 2000-01-01T00:00:00
    const { desc, id, startDateString, endDateString } = req.body;
    const result = {
      success: false,
      message: "",
      data: null,
    };
    req.result = result;

    let mongoConnection = null;
    let filter = {};
    let sort = 0;
    let startDate;
    let endDate;

    if (startDateString) {
      startDate = new Date(startDateString);
    } else {
      startDate = new Date("2024-01-01T00:00:00");
    }
    if (endDateString) {
      endDate = new Date(endDateString);
    } else {
      endDate = new Date("2099-12-31T00:00:00");
    }

    console.log(filter);

    // 내림차순으로 정렬해야 함
    if (desc === "true") {
      sort = -1;
      // 오름차순으로 정렬해야 함
    } else if (desc === "false") {
      sort = 1;
    }

    try {
      const uri = "mongodb://localhost:27017"; // MongoDB 서버 URI
      const dbName = process.env.MONGO_DB_DATABASE; // 연결할 데이터베이스 이름
      const client = new MongoClient(uri);
      await client.connect();
      const logCollection = client.db(dbName).collection("log");

      const logArr = await logCollection
        .find({
          accountId: { $regex: id, $options: "i" },
          createdAt: { $gt: startDate, $lt: endDate },
        })
        // find안에 들어갈 filter object를 밖에서 만들기
        // .find({
        //   // id를 입력했을 경우엔 해당 아이디의 사용자가 요청한 api만, id를 입력하지 않았을 경우 모든 사용자가 요청한 api
        //   // accountIdx:
        //   //   id.length > 0 ? { $eq: req.search_accountIdx } : { $gt: -1 },
        //   // accountId: id.length > 0 ? { $regex: id, $options: "i" } : {},
        //   accountId: { $regex: id, $options: "i" },
        //   createdAt: { $gt: startDate, $lt: endDate },
        // })
        //.find(filter)
        .limit(5)
        .sort({ createdAt: sort })
        .toArray();

      result.data = logArr;
      result.success = true;
      result.message = "get api log success";

      req.code = 200;

      res.status(req.code).send(result);
    } catch (err) {
      result.message = err.message ? err.message : "알 수 없는 서버 에러";
      next(err);
    } finally {
      if (mongoConnection) {
        mongoConnection.close();
      }
    }
  }
);

module.exports = router;
