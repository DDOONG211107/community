const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

// // mongoConnection = await MongoClient.connect("mongodb://localhost:27017");
// const mongoConnection = async () =>
//   await MongoClient.connect("mongodb://localhost:27017");
async function mongoConnection() {
  //   if (!client.isConnected()) {
  //     await client.connect();
  //   }
  return client;
}

module.exports = mongoConnection;
