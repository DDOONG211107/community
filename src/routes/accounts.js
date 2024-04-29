const router = require("express").Router();
const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");
const { checkEmail } = require("../middleware/checkEmail");
const { checkId } = require("../middleware/checkId");
const { checkIsLogged } = require("../middleware/checkIsLogged");

const {
  Id,
  Password,
  PasswordCheck,
  Name,
  Nickname,
  Email,
  validate,
} = require("../middleware/validate");

router.post("/login", [Id, Password, validate], async (req, res, next) => {
  const { id, password } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/login",
    rest: "post",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };

  let client = null;
  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE id = $1 AND password = $2";
    const values = [id, password];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.message = "서버: 아이디 또는 비밀번호 오류";
      log.code = 204;
    } else if (data.rows.length == 1) {
      req.session.accountIdx = data.rows[0].idx;
      req.session.role = data.rows[0].role_idx;

      result.success = true;
      result.message = "login success";
      log.code = 200;
    }
    res.log = log;
    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "accounts/login",
      rest: "post",
      code: err.code,
      message: err.message,
      result: result,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// * 상태를 변경(제출)하는 의미로 쓰면 포스트 (포스트가 권장됨)
router.delete("/logout", (req, res, next) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };

  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/logout",
    rest: "delete",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };

  try {
    req.session.destroy(function (err) {
      if (err) {
        result.message = err.message ? err.message : "알 수 없는 서버 에러";
        return next({
          name: "accounts/logout",
          rest: "delete",
          code: err.code,
          message: err.message,
          result: result,
        });
      }
    });
    result.message = "logout success";
    result.success = true;

    log.code = 200;
    res.log = log;
    res.status(log.code).send(result);
  } catch (err) {
    next(err);
  }
});

router.get("/check-email", [Email, validate], checkEmail, (req, res, next) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };

  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/check-email",
    rest: "get",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };
  try {
    result.message = "이메일 사용 가능";
    result.success = true;

    log.code = 200;
    res.log = log;

    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "accounts/check-email",
      rest: "get",
      code: err.code,
      message: err.message,
      result: result,
    });
  }
});

router.get("/check-id", [Id, validate], checkId, (req, res, next) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/check-id",
    rest: "get",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };
  try {
    result.message = "아이디 사용 가능";
    result.success = true;

    log.code = 200;
    res.log = log;

    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "accounts/check-id",
      rest: "get",
      code: err.code,
      message: err.message,
      result: result,
    });
  }
});

router.post(
  "/",
  [Id, Password, PasswordCheck, Email, Name, Nickname, validate],
  checkId,
  checkEmail,
  async (req, res, next) => {
    const { id, email, name, nickname, password, passwordCheck } = req.body;
    const result = {
      success: false,
      message: "",
      data: null,
    };
    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      name: "accounts/",
      rest: "post",
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 500,
    };
    let client = null;

    try {
      if (password != passwordCheck) {
        result.message = "비밀번호가 일치하지 않습니다";
        log.code = 400;
      } else {
        const pool = await new Pool(psqlPoolClient);
        client = await pool.connect();

        const sql = `
            INSERT INTO account.list (id, password, name, nickname, email, role_idx) 
            VALUES ($1, $2, $3, $4, $5, 2)`;
        const values = [id, password, name, nickname, email];
        await client.query(sql, values);

        result.message = "signup success";
        result.success = true;
        log.code = 200;
      }
      res.log = log;
      res.status(log.code).send(result);
    } catch (err) {
      result.message = err.message ? err.message : "알 수 없는 서버 에러";
      next({
        name: "accounts/",
        rest: "post",
        code: err.code,
        message: err.message,
        result: result,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

router.get("/find-id", [Email, Name, validate], async (req, res, next) => {
  const { email, name } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/fine-id",
    rest: "get",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE email = $1 AND name = $2";
    const values = [email, name];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.message = "id가 존재하지 않음";
      log.code = 204;
    } else if (data.rows.length == 1) {
      result.data = { id: data.rows[0].id };
      result.success = true;
      result.message = "find-id success";
      log.code = 200;
    }
    res.log = log;
    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "accounts/find-id",
      rest: "get",
      code: err.code,
      message: err.message,
      result: result,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.get("/find-password", [Email, Id, validate], async (req, res, next) => {
  const { email, id } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/find-password",
    rest: "get",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE email = $1 AND id = $2";
    const values = [email, id];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.message = "비밀번호가 존재하지 않음";
      log.code = 204;
    } else if (data.rows.length == 1) {
      result.data = { password: data.rows[0].password };
      result.success = true;
      result.message = "find-password success";
      log.code = 200;
    }
    res.log = log;
    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "accounts/find-password",
      rest: "get",
      code: err.code,
      message: err.message,
      result: result,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.get("/", checkIsLogged, async (req, res, next) => {
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/",
    rest: "get",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };
  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE idx = $1";
    const values = [accountIdx];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.message = "계정정보가 존재하지 않음";
      log.code = 204;
    } else if (data.rows.length == 1) {
      result.data = data.rows;
      result.success = true;
      result.message = "get profile success";
      log.code = 200;
    }
    res.log = log;
    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "accounts/",
      rest: "get",
      code: err.code,
      message: err.message,
      result: result,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.put(
  "/",
  [Name, Nickname, Email, Password, PasswordCheck, validate],
  checkIsLogged,
  checkEmail,
  async (req, res, next) => {
    const { accountIdx } = req.session;
    const { name, nickname, email, password, passwordCheck } = req.body;
    const result = {
      success: false,
      message: "",
      data: null,
    };
    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      name: "accounts/",
      rest: "put",
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 500,
    };
    let client = null;

    try {
      if (password != passwordCheck) {
        result.message = "비밀번호가 일치하지 않습니다";
        log.code = 400;
      } else {
        const pool = await new Pool(psqlPoolClient);
        client = await pool.connect();

        const sql =
          "UPDATE account.list SET email = $1, name = $2, nickname = $3, password = $4 WHERE idx = $5";
        const values = [email, name, nickname, password, accountIdx];
        await client.query(sql, values);

        result.message = "edit profile success";
        result.success = true;
        log.code = 200;
      }
      res.log = log;
      res.status(log.code).send(result);
    } catch (err) {
      result.message = err.message ? err.message : "알 수 없는 서버 에러";
      next({
        name: "accounts/",
        rest: "put",
        code: err.code,
        message: err.message,
        result: result,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

router.delete("/", checkIsLogged, async (req, res, next) => {
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "accounts/",
    rest: "delete",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "DELETE FROM account.list WHERE idx = $1";
    const values = [accountIdx];
    await client.query(sql, values);

    req.session.destroy(function (err) {
      console.log("회원탈퇴 성공");
    });

    result.message = "delete success";
    result.success = true;

    log.code = 200;
    res.log = log;
    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "accounts/",
      rest: "delete",
      code: err.code,
      message: err.message,
      result: result,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
