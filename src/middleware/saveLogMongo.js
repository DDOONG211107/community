const mongoClient = require("mongodb").MongoClient;

const saveLogMongo = (req, res, next) => {
  let mongoConnection = null;

  res.on("finish", async () => {
    const { log } = res;
    console.log(log);

    try {
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
