const mongoClient = require("mongodb").MongoClient;

const saveLogMongo = (req, res, next) => {
  let mongoConnection = null;

  // 이 안에다 로그를 만들어주고 중복코드 없애기

  res.on("finish", async () => {
    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      accountId: req.session.accountId ? req.session.accountId : "",
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
    try {
      console.log(log);
      mongoConnection = await mongoClient.connect("mongodb://localhost:27017");
      await mongoConnection
        .db(process.env.MONGO_DB_DATABASE)
        .collection("log")
        .insertOne(log);
    } catch (err) {
      console.log(err);
    }

    mongoConnection.close();
  });

  next();
};

module.exports = saveLogMongo;
