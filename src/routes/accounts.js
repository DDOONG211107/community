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
  let client = null;
  let status = 500;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE id = $1 AND password = $2";
    const values = [id, password];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.success = false;
      result.message = "서버: 아이디 또는 비밀번호 오류";
      status = 201;
    } else if (data.rows.length == 1) {
      req.session.accountIdx = data.rows[0].idx;
      req.session.role = data.rows[0].role_idx;
      result.success = true;
      result.message = "login success";
      status = 200;
    }
    client.release();
    res.status(status).send(result);
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

// * 상태를 변경(제출)하는 의미로 쓰면 포스트 (포스트가 권장됨)
router.delete("/logout", (req, res, next) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    req.session.destroy(function (err) {
      if (err) {
        next(err);
        return;
      } else {
        result.message = "logout success";
        result.success = true;
        res.status(200).send(result);
      }
    });
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
  try {
    result.message = "이메일 사용 가능";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.get("/check-id", [Id, validate], checkId, (req, res, next) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  try {
    result.message = "아이디 사용 가능";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    next(err);
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
    let client = null;

    try {
      if (password != passwordCheck) {
        next({ message: "비밀번호가 일치하지 않습니다", status: 400 });
        return;
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `INSERT INTO account.list (id, password, name, nickname, email, role_idx) 
        VALUES ($1, $2, $3, $4, $5, 2)`;
      const values = [id, password, name, nickname, email];
      await client.query(sql, values);
      client.release();

      result.message = "signup success";
      result.success = true;
      res.status(200).send(result);
    } catch (err) {
      if (client) {
        client.release();
      }
      next(err);
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

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE email = $1 AND name = $2";
    const values = [email, name];
    const data = await client.query(sql, values);
    client.release();

    if (data.rows.length == 0) {
      next({ status: 409, message: "id가 존재하지 않음" }); // 409가 낫ㅏ
    } else if (data.rows.length == 1) {
      result.data = { id: data.rows[0].id };
      result.success = true;
      result.message = "find-id success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

router.get("/find-password", [Email, Id, validate], async (req, res, next) => {
  const { email, id } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE email = $1 AND id = $2";
    const values = [email, id];
    const data = await client.query(sql, values);
    client.release();

    if (data.rows.length == 0) {
      next({ status: 409, message: "비밀번호가 존재하지 않음" });
    } else if (data.rows.length == 1) {
      result.data = { password: data.rows[0].password };
      result.success = true;
      result.message = "find-password success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "SELECT * FROM account.list WHERE idx = $1";
    const values = [accountIdx];
    const data = await client.query(sql, values);
    client.release();

    if (data.rows.length == 0) {
      next({ status: 404, message: "계정정보가 존재하지 않음" });
    } else if (data.rows.length == 1) {
      result.data = data.rows;
      result.success = true;
      result.message = "get profile success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
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
    let client = null;

    try {
      if (password != passwordCheck) {
        next({ status: 201, message: "비밀번호가 일치하지 않습니다" });
        return;
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql =
        "UPDATE account.list SET email = $1, name = $2, nickname = $3, password = $4 WHERE idx = $5";
      const values = [email, name, nickname, password, accountIdx];
      await client.query(sql, values);
      client.release();

      result.message = "edit profile success";
      result.success = true;
      res.status(200).send(result);
    } catch (err) {
      if (client) {
        client.release();
      }
      next(err);
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

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = "DELETE FROM account.list WHERE idx = $1";
    const values = [accountIdx];
    await client.query(sql, values);
    client.release();

    req.session.destroy(function (err) {
      console.log("회원탈퇴 성공");
    });

    result.message = "delete success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

module.exports = router;
