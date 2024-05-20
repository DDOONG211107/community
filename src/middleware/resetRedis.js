const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6380 });
const { pgPool } = require("../database/postgreSQL");
const CronJob = require("cron").CronJob;

async function resetTodayUsers() {
  console.log("리셋 시작");
  // Redis의 todayUsers collection 초기화
  await redisClient.connect();
  const todayCount = await redisClient.bitCount("todayUsers_bit");
  console.log(todayCount);
  const todayDate = new Date();
  const todayString = todayDate.toISOString().slice(0, 10);

  await pgPool.query(
    `
      INSERT INTO data.visit_count (created_at, date, count) 
      VALUES ($1, $2, $3)
      `,
    [todayDate, todayString, todayCount]
  );

  // 개인 누적 로그인
  const keys = await redisClient.hKeys("login_count");
  const keyNumbers = keys.map(Number);
  const vals = await redisClient.hVals("login_count");
  const valNumbers = vals.map(Number);

  for (let i = 0; i < keyNumbers.length; i++) {
    await pgPool.query(
      `
        UPDATE account.list 
        SET login_count = login_count + $1 
        WHERE idx = $2
      `,
      [valNumbers[i], keyNumbers[i]]
    );
  }

  await redisClient.del("todayUsers_bit");
  await redisClient.del("login_count");
  await redisClient.disconnect();

  //   console.log(keys);
  //   console.log(vals);

  console.log("리셋 끝");
}

// 자정에 실행될 cron job 생성
const resetRedis = new CronJob("*/3 * * * *", resetTodayUsers); // 매일 자정마다 실행
// cron job 시작
resetRedis.start();

module.exports = resetRedis;
