const redisClient = redis.createClient({ host: "localhost", port: 6380 });
const RedisStore = require("connect-redis").default;

redisClient.connect();

const redisStore = new RedisStore({
  client: redisClient,
  //prefix: "myapp:",
});

module.exports = redisStore;
