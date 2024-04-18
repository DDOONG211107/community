const router = require("express").Router();
const { Client } = require("pg");
const psqlClient = require("../database/postgreSQL");
const { checkEmail, checkId } = require("../middleware/account");
const { checkIsLogged } = require("../middleware/checkAuthorization");
const {
  Id,
  Password,
  PasswordCheck,
  Name,
  Nickname,
  Email,
  validate,
} = require("../middleware/validate");

router.post("/login", [Id, Password, validate], async (req, res) => {
  const { id, password } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient);

  try {
    await client.connect();
    const sql = "SELECT * FROM account.list WHERE id = $1 AND password = $2";
    const values = [id, password];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.success = false;
      client.end();

      res.status(400).send({
        message: "login fail",
      });
    } else {
      if (data.rows.length != 1) {
        res.status(500).send({ message: "서버: 아이디 또는 비밀번호 오류" });
      } else {
        req.session.accountIdx = data.rows[0].idx;
        req.session.role = data.rows[0].role_idx;
        result.success = true;
        result.message = "login success";
        client.end();

        res.status(200).send(result);
      }
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(500).send({ message: err.message });
  }
});

// * 상태를 변경(제출)하는 의미로 쓰면 포스트 (포스트가 권장됨)
router.delete("/logout", (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    req.session.destroy(function (err) {
      if (err) {
        res.status(500).send({ message: "서버: logout failed" });
        return;
      }
      result.message = "logout success";
      result.success = true;

      res.status(200).send(result);
    });
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
  }
});

router.get("/check-email", [Email, validate], checkEmail, (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  result.message = "이메일 사용 가능";
  result.success = true;
  res.status(200).send(result);
});

router.get("/check-id", [Id, validate], checkId, (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  result.message = "아이디 사용 가능";
  result.success = true;
  res.status(200).send(result);
});

router.post(
  "/",
  [Id, Password, PasswordCheck, Email, Name, Nickname, validate],
  checkId,
  checkEmail,
  async (req, res) => {
    const { id, email, name, nickname, password, passwordCheck } = req.body;
    const result = {
      success: false,
      message: "",
      data: null,
    };
    const client = new Client(psqlClient);

    try {
      if (password != passwordCheck) {
        throw { message: "비밀번호가 일치하지 않습니다", status: 400 };
      }

      await client.connect();
      const sql =
        "INSERT INTO account.list (id, password, name, nickname, email, role_idx) VALUES ($1, $2, $3, $4, $5, 2)";
      const values = [id, password, name, nickname, email];
      await client.query(sql, values);
      await client.end();

      result.message = "signup success";
      result.success = true;
      res.status(200).send(result);
    } catch (err) {
      if (client) {
        client.end();
      }
      res.status(err.status || 500).send({ message: err.message });
    }
  }
);

router.get("/find-id", [Email, Name, validate], async (req, res) => {
  const { email, name } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  const client = new Client(psqlClient);

  try {
    await client.connect();
    const sql = "SELECT * FROM account.list WHERE email = $1 AND name = $2";
    const values = [email, name];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "id가 존재하지 않음";
      res.status(409).send(result); // 이것도 409가 낫다.
    } else if (data.rows.length == 1) {
      result.data = { id: data.rows[0].id };
      result.success = true;
      result.message = "find-id success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
});

router.get("/find-password", [Email, Id, validate], async (req, res) => {
  const { email, id } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  const client = new Client(psqlClient);

  try {
    await client.connect();
    const sql = "SELECT * FROM account.list WHERE email = $1 AND id = $2";
    const values = [email, id];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "계정정보가 존재하지 않음";
      res.status(409).send(result); // 이것도 409가 낫다.
    } else if (data.rows.length == 1) {
      result.data = { password: data.rows[0].password };
      result.success = true;
      result.message = "find-password success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  const client = new Client(psqlClient);

  try {
    await client.connect();
    const sql = "SELECT * FROM account.list WHERE idx = $1";
    const values = [accountIdx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "서버: 계정정보가 존재하지 않음";
      res.status(404).send(result);
    } else if (data.rows.length == 1) {
      result.data = {
        id: data.rows[0].id,
        name: data.rows[0].name,
        nickname: data.rows[0].nickname,
        email: data.rows[0].email,
        password: data.rows[0].passowrd,
      };

      result.success = true;
      result.message = "get profile success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
});

router.put(
  "/",
  [Name, Nickname, Email, Password, PasswordCheck, validate],
  checkIsLogged,
  checkEmail,
  async (req, res) => {
    const { accountIdx } = req.session;
    const { name, nickname, email, password, passwordCheck } = req.body;
    const result = {
      success: false,
      message: "",
      data: null,
    };
    const client = new Client(psqlClient);

    try {
      if (password != passwordCheck) {
        throw { message: "server:비밀번호가 일치하지 않습니다", status: 400 };
      }

      await client.connect();
      const sql =
        "UPDATE account.list SET email = $1, name = $2, nickname = $3, password = $4 WHERE idx = $5";
      const values = [email, name, nickname, password, accountIdx];
      await client.query(sql, values);
      await client.end();

      result.message = "edit profile success";
      result.success = true;
      res.status(200).send(result);
    } catch (err) {
      if (client) {
        client.end();
      }
      res.status(err.status || 500).send({ message: err.message });
    }
  }
);

router.delete("/", checkIsLogged, async (req, res) => {
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  const client = new Client(psqlClient);

  try {
    await client.connect();
    const sql = "DELETE FROM account.list WHERE idx = $1";
    const values = [accountIdx];
    await client.query(sql, values);
    await client.end();

    req.session.destroy(function (err) {
      console.log("회원탈퇴 성공");
    });

    result.message = "delete success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
});

module.exports = router;
