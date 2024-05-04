const router = require("express").Router();
const { pgPool } = require("../database/postgreSQL");
const { checkEmail } = require("../middleware/checkEmail");
const { checkId } = require("../middleware/checkId");
const { checkIsLogin } = require("../middleware/checkIsLogin");

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
      req.code = 200;
      throw new Exception(200, "서버: 아이디 또는 비밀번호 오류");
    }
    req.session.accountIdx = user.idx;
    req.session.role = user.role_idx;
    req.session.accountId = user.id;

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

// * 상태를 변경(제출)하는 의미로 쓰면 포스트 (포스트가 권장됨)
router.delete(
  "/logout",
  wrapper((req, res) => {
    req.session.destroy(function (err) {});

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
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
  checkId,
  checkEmail,
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
    const { accountIdx } = req.session;

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
    const { accountIdx } = req.session;
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
    const { accountIdx } = req.session;

    await pgPool.query("DELETE FROM account.list WHERE idx = $1", [accountIdx]);

    req.session.destroy(function (err) {
      console.log("회원탈퇴 성공");
    });

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

module.exports = router;
