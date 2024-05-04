const mongoConnection = require("../database/mongoDB");
const wrapper = require("../module/wrapper");

const saveLogMongo = wrapper((req, res, next) => {
  // 이 안에다 로그를 만들어주고 중복코드 없애기

  res.on("finish", async () => {
    const log = {
      accountIdx: req.session ? req.session.accountIdx : 0,
      accountId: req.session ? req.session.accountId : "",
      path: req.isError
        ? "error-handler" + req.baseUrl + req.path
        : req.baseUrl + req.path, // req.path
      rest: req.method, // req.method
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: req.result, // req.result
      code: req.code || 500, // req.code
    };

    const mongoClient = await mongoConnection();
    await mongoClient
      .db(process.env.MONGO_DB_DATABASE)
      .collection("log")
      .insertOne(log);
  });

  next();
});

module.exports = saveLogMongo;
