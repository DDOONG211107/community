const router = require("express").Router();
const redis = require("redis");
const redisClient = redis.createClient({ host: "localhost", port: 6380 });
const { pgPool } = require("../database/postgreSQL");
const { checkEmail } = require("../middleware/checkEmail");
const { checkId } = require("../middleware/checkId");
const { checkIsLogin } = require("../middleware/checkIsLogin");
const crypto = require("crypto");

const {
  Id,
  Password,
  PasswordCheck,
  Name,
  Nickname,
  Email,
  validate,
} = require("../middleware/validate");
const result = require("../module/result");
const wrapper = require("../module/wrapper");
const { Exception } = require("../module/Exception");

router.post(
  "/login",
  [Id, Password, validate],
  wrapper(async (req, res) => {
    const { id, password } = req.body;
    const selectResult = await pgPool.query(
      "SELECT * FROM account.list WHERE id = $1 AND password = $2",
      [id, password]
    );
    const user = selectResult.rows[0];

    if (!user) {
      req.code = 400; // 200은 로그인성공과 구분이 안되므로 400으로 바꿨다
      throw new Exception(400, "서버: 아이디 또는 비밀번호 오류");
    }

    await redisClient.connect();
    await redisClient.setBit("todayUsers_bit", user.idx, 1);
    await redisClient.hIncrBy("login_count", `${user.idx}`, 1);

    const sessions = await redisClient.hKeys(
      "redisSession",
      `user_${user.idx}_*`
    );
    console.log(sessions); // [ 'user_1_5e75394c384110753c6c33d85699edd7e1e57db5' ]

    for (let i = 0; i < sessions.length; i++) {
      await redisClient.hDel("redisSession", sessions[i]);
    }

    const newSessionId = crypto.randomBytes(20).toString("hex");
    await redisClient.hSet(
      "redisSession",
      `user_${user.idx}_${newSessionId}`,
      JSON.stringify({
        accountIdx: user.idx,
        role: user.role_idx,
        accountId: user.id,
      })
    );

    // const newSession = await redisClient.hGet(
    //   "redisSession",
    //   `user_${user.idx}_${newSessionId}`
    // );
    // console.log(newSession); // {"accountIdx":1,"role":1,"accountId":"admin               "}

    await redisClient.expire(`user_${user.idx}_${newSessionId}`, 60 * 60 * 10);
    console.log(newSessionId); // 50f23df647485b59b2b03cda462eba9995155c30

    // req.redisSession = {
    //   sessionId: newSessionId,
    //   accountIdx: user.idx,
    //   role: user.role_idx,
    //   accountId: user.id,
    // };
    // console.log(req.redisSession);
    res.cookie("session", `user_${user.idx}_${newSessionId}`, {
      httpOnly: true,
      secure: false,
    });
    res.cookie("accountIdx", `${user.idx}`, { httpOnly: true, secure: false });

    await redisClient.disconnect();

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);

    // const selectSessionResult = await pgPool.query(
    //   `
    //   SELECT * FROM session WHERE (sess::json -> 'user') ->> 'accountIdx' = $1
    //   `,
    //   [user.idx]
    // );
    // const newSessionId = req.sessionID;
    // const sessions = selectSessionResult.rows;
    // for (let i = 0; i < sessions.length; i++) {
    //   if (sessions[i].sid != newSessionId) {
    //     // console.log("호이");
    //     await req.sessionStore.destroy(sessions[i].sid);
    //   }
    // }
    // req.session.user = {
    //   accountIdx: user.idx,
    //   role: user.role_idx,
    //   accountId: user.id,
    // };
    // console.log(req.session.user);

    // console.log(req.session.user);
    // req.session.save((err) => {
    //   console.log("최소한 여기는 들어온다");
    //   if (err) {
    //     console.error("Session save error:", err);
    //   }
    // });
  })
);

// * 상태를 변경(제출)하는 의미로 쓰면 포스트 (포스트가 권장됨)
router.delete(
  "/logout",
  wrapper(async (req, res) => {
    // // console.log(req.session.user);
    // await req.session.destroy((err) => {
    //   if (err) {
    //     throw err;
    //   }
    // });

    await redisClient.connect();
    const session = req.cookies.session;
    console.log("로그아웃 안의 세션아이디", session);
    await redisClient.hDel("redisSession", session);
    await redisClient.disconnect();
    // const sessionId = req.redisSession.sessionId;

    req.code = 200;
    req.result = result();
    res.status(req.code).send(req.result); // 200 대신 req.code로 쓰면 유지보수가 편하고, 200으로 쓰면 보기에 편하긴 하다
  })
);

router.get("/check-email", [Email, validate], checkEmail, (req, res) => {
  req.code = 200;
  req.result = result();
  res.status(200).send(req.result);
});

router.get("/check-id", [Id, validate], checkId, (req, res) => {
  req.code = 200;
  req.result = result();
  res.status(200).send(req.result);
});

router.post(
  "/",
  [Id, Password, PasswordCheck, Email, Name, Nickname, validate],
  checkEmail,
  checkId,
  wrapper(async (req, res) => {
    const { id, email, name, nickname, password, passwordCheck } = req.body;

    if (password != passwordCheck) {
      throw new Exception(400, "비밀번호가 일치하지 않습니다");
    }

    await pgPool.query(
      `
      INSERT INTO account.list (id, password, name, nickname, email, role_idx) 
      VALUES ($1, $2, $3, $4, $5, 2)
      `,
      [id, password, name, nickname, email]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

router.get(
  "/find-id",
  [Email, Name, validate],
  wrapper(async (req, res) => {
    const { email, name } = req.body;
    const selectResult = await pgPool.query(
      "SELECT * FROM account.list WHERE email = $1 AND name = $2",
      [email, name]
    );
    const user = selectResult.rows[0];

    if (!user) {
      req.code = 200;
      throw new Exception(200, "해당 계정 존재하지 않음");
    }

    req.code = 200;
    req.result = result({ id: user.id });
    res.status(req.code).send(req.result);
  })
);

router.get(
  "/find-password",
  [Email, Id, validate],
  wrapper(async (req, res) => {
    const { email, id } = req.body;
    const selectResult = await pgPool.query(
      "SELECT * FROM account.list WHERE email = $1 AND id = $2",
      [email, id]
    );
    const user = selectResult.rows[0];

    if (!user) {
      req.code = 200;
      throw new Exception(200, "해당 계정 존재하지 않음");
    }

    req.code = 200;
    req.result = result({ password: user.password });
    res.status(200).send(req.result);
  })
);

router.get(
  "/",
  checkIsLogin,
  wrapper(async (req, res) => {
    const accountIdx = req.cookies.accountIdx;

    const selectResult = await pgPool.query(
      "SELECT * FROM account.list WHERE idx = $1",
      [accountIdx]
    );
    const user = selectResult.rows[0];

    if (!user) {
      req.code = 404;
      throw new Exception(404, "계정 정보가 존재하지 않음");
    }

    req.code = 200;
    req.result = result(user);
    res.status(200).send(req.result);
  })
);

router.put(
  "/",
  [Name, Nickname, Email, Password, PasswordCheck, validate],
  checkIsLogin,
  checkEmail,
  wrapper(async (req, res) => {
    const accountIdx = req.cookies.accountIdx;
    const { name, nickname, email, password, passwordCheck } = req.body;

    if (password != passwordCheck) {
      req.code = 400;
      throw new Exception(400, "비밀번호가 일치하지 않습니다");
    }

    await pgPool.query(
      "UPDATE account.list SET email = $1, name = $2, nickname = $3, password = $4 WHERE idx = $5",
      [email, name, nickname, password, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

router.delete(
  "/",
  checkIsLogin,
  wrapper(async (req, res, next) => {
    const accountIdx = req.cookies.accountIdx;
    await pgPool.query("DELETE FROM account.list WHERE idx = $1", [accountIdx]);

    await redisClient.connect();
    const session = req.cookies.session;
    await redisClient.hDel("redisSession", session);
    await redisClient.disconnect();

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

module.exports = router;
