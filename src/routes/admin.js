const router = require("express").Router();
const { MongoClient } = require("mongodb");

const { getIdx } = require("../middleware/getIdx");
const { checkIsAdmin } = require("../middleware/checkIsAdmin");
const { StartDate, EndDate, Id, validate } = require("../middleware/validate");

router.get(
  "/",
  [Id, StartDate, EndDate, validate],
  checkIsAdmin,
  getIdx,
  async (req, res, next) => {
    // string, string, 2000-01-01T00:00:00, 2000-01-01T00:00:00
    const { desc, id, startDateString, endDateString } = req.body;
    const result = {
      success: false,
      message: "",
      data: null,
    };
    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      name: "admin/",
      rest: "get",
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 500,
    };

    let mongoConnection = null;
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

    if (desc === "true") {
      // 내림차순으로 정렬해야 함
      sort = -1;
    } else if (desc === "false") {
      // 오름차순으로 정렬해야 함
      sort = 1;
    }

    try {
      //   mongoConnection = await mongoClient.connect("mongodb://localhost:27017");
      //   const logArr = await mongoConnection
      //     .db(process.env.MONGO_DB_DATABASE)
      //     .collection("log")
      //     .find(filter);

      //   mongoClient.connect("mongodb://localhost:27017", function (err, db) {
      //     console.log("여기는???");
      //     const mongoDB = db.db(process.env.MONGO_DB_DATABASE);
      //     mongoDB
      //       .collection("log")
      //       .find({ accountIdx: "1" })
      //       .toArray(function (err, logArr) {
      //         console.log("여기 들어오긴 함");

      //         console.log(logArr);
      //         result.data = logArr;
      //         db.close();
      //       });
      //   });

      const uri = "mongodb://localhost:27017"; // MongoDB 서버 URI
      const dbName = process.env.MONGO_DB_DATABASE; // 연결할 데이터베이스 이름

      const client = new MongoClient(uri);
      await client.connect();
      //   console.log("Connected to MongoDB");
      //   const db = client.db(dbName);

      const logCollection = client.db(dbName).collection("log");

      const logArr = await logCollection
        .find({
          accountIdx:
            id.length > 0 ? { $eq: req.search_accountIdx } : { $gt: -1 },
          createdAt: { $gt: startDate, $lt: endDate },
        })
        .limit(5)
        .sort({ createdAt: sort })
        .toArray();
      result.data = logArr;
      // console.log("Found data:", logArr);

      result.success = true;
      result.message = "get api log success";

      log.code = 200;

      res.log = log;
      res.status(log.code).send(result);
    } catch (err) {
      result.message = err.message ? err.message : "알 수 없는 서버 에러";
      next({
        name: "admin/",
        rest: "get",
        code: err.code,
        message: err.message,
        result: result,
      });
    } finally {
      if (mongoConnection) {
        mongoConnection.close();
      }
    }
  }
);

module.exports = router;
