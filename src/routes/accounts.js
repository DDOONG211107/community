const router = require("express").Router();
const mariaDB = require("../maria");

const regex = {
  idReg: /^[a-zA-Z0-9]{1,20}$/,
  passwordReg: /^[a-zA-Z0-9]{1,20}$/,
  nameReg: /^[가-힣a-zA-Z]{1,10}$/,
  nicknameReg: /^[가-힣a-zA-Z0-9]{1,10}$/,
  emailReg: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
};

router.post("/login", (req, res) => {
  const { id, password } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.idReg.test(id)) {
      throw { message: "invalid id input", status: 400 };
    }

    if (!regex.passwordReg.test(password)) {
      throw { message: "invalid password input", status: 400 };
    }

    // db로 로그인 정보 확인
    mariaDB.query(
      "SELECT * FROM account WHERE id = ? AND password = ?",
      [id, password],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "login fail";
          res.status(400).send(result);
        } else if (rows.length === 1) {
          req.session.accountIdx = rows[0].idx;
          result.message = "login success";
          result.success = true;
          res.status(200).send(result);
        } else {
          throw { message: "서버: 로그인 과정에 문제가 생김", status: 500 };
        }
      }
    );
  } catch (err) {
    res.status(err.status).send({ message: err.message });
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
      console.log("로그아웃 성공");
    });
    result.message = "logout success";
    result.success = true;

    res.status(200).send(result);
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
  }
});

router.get("/check-id", (req, res) => {
  const { accountIdx } = req.session;
  const { id } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.idReg.test(id)) {
      throw { message: "invalid id input", status: 400 };
    }

    mariaDB.query("SELECT * FROM account WHERE id = ?", [id], (err, rows) => {
      if (err) {
        result.message = err.sqlMessage;
        res.status(500).send(result);
      } else if (
        rows.length === 0 ||
        (rows.length === 1 && rows[0].idx == accountIdx)
      ) {
        result.message = "아이디 사용 가능";
        result.success = true;
        res.status(200).send(result);
      } else {
        result.message = "서버: 해당 아이디 중복. 사용불가";
        res.status(409).send(result);
      }
    });
  } catch (err) {
    res.status(err.status).send({ message: err.message });
  }
});

router.get("/check-email", (req, res) => {
  const { accountIdx } = req.session;
  const { email } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.emailReg.test(email)) {
      throw { message: "invalid email input", status: 400 };
    }

    mariaDB.query(
      "SELECT * FROM account WHERE email = ?",
      [email],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (
          rows.length === 0 ||
          (rows.length === 1 && rows[0].idx == accountIdx)
        ) {
          result.message = "이메일 사용 가능";
          result.success = true;
          res.status(200).send(result);
        } else {
          result.message = "서버: 해당 이메일 중복. 사용불가";
          res.status(409).send(result);
        }
      }
    );
  } catch (err) {
    res.status(err.status).send({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { id, email, name, nickname, password, passwordCheck } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.idReg.test(id)) {
      throw { message: "invalid id input", status: 400 };
    }

    if (!regex.emailReg.test(email)) {
      throw { message: "invalid email input", status: 400 };
    }

    if (!regex.nameReg.test(name)) {
      throw { message: "invalid name input", status: 400 };
    }

    if (!regex.nicknameReg.test(nickname)) {
      throw { message: "invalid nickname input", status: 400 };
    }

    if (!regex.passwordReg.test(password)) {
      throw { message: "invalid password input", status: 400 };
    }

    if (!regex.passwordReg.test(passwordCheck)) {
      throw { message: "invalid passwordCheck input", status: 400 };
    }

    if (password != passwordCheck) {
      throw { message: "비밀번호가 일치하지 않습니다", status: 400 };
    }

    console.log("정규화까지 통과했음");

    // 아이디 중복체크부터 시작.
    mariaDB.query("SELECT * FROM account WHERE id = ?", [id], (err, rows) => {
      if (err) {
        result.message = err.sqlMessage;
        res.status(500).send(result);
      } else if (rows.length === 1) {
        result.message = "서버: 해당 아이디 중복. 사용불가";
        res.status(409).send(result);
        // 아이디는 사용 가능. 이제 이메일 중복 체크
      } else if (rows.length === 0) {
        mariaDB.query(
          "SELECT * FROM account WHERE email = ?",
          [email],
          (err, rows) => {
            if (err) {
              result.message = err.sqlMessage;
              res.status(500).send(result);
            } else if (rows.length === 1) {
              result.message = "서버: 해당 이메일 중복. 사용불가";
              res.status(409).send(result);
            } else if (rows.length === 0) {
              // 아이디와 이메일 모두 사용 가능. 테이블에 삽입.
              mariaDB.query(
                "INSERT INTO account (id, password, name, nickname, email, role_idx ) VALUES (?, ?, ?, ?, ?, 2)",
                [id, password, name, nickname, email],
                (err, rows) => {
                  if (err) {
                    console.log("문제가 생겼음");
                    result.message = err.sqlMessage;
                    res.status(500).send(result);
                  } else {
                    console.log("문제 없음");
                    result.message = "signup success";
                    result.success = true;
                    res.status(200).send(result);
                  }
                }
              );
            }
          }
        );
      }
    });
  } catch (err) {
    console.log("뭔가 에러:", err.status);
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

router.get("/find-id", (req, res) => {
  const { email, name } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.emailReg.test(email)) {
      throw { message: "invalid email input", status: 400 };
    }

    if (!regex.nameReg.test(name)) {
      throw { message: "invalid name input", status: 400 };
    }

    // db로 아이디 정보 확인
    mariaDB.query(
      "SELECT * FROM account WHERE email = ? AND name = ?",
      [email, name],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "id가 존재하지 않음";
          res.status(400).send(result);
        } else if (rows.length === 1) {
          result.data = { id: rows[0].id };
          result.success = true;
          result.message = "find-id success";
          res.status(200).send(result);
        } else {
          throw { message: "서버: db 문제가 생김", status: 500 };
        }
      }
    );
  } catch (err) {
    res.status(err.status).send({ message: err.message });
  }
});

router.get("/find-password", (req, res) => {
  const { email, id } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.emailReg.test(email)) {
      throw { message: "invalid message input", status: 400 };
    }

    if (!regex.idReg.test(id)) {
      throw { message: "invalid id input", status: 400 };
    }

    mariaDB.query(
      "SELECT * FROM account WHERE email = ? AND id = ?",
      [email, id],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "비밀번호가 존재하지 않음";
          res.status(400).send(result);
        } else if (rows.length === 1) {
          result.data = { passowrd: rows[0].password };
          result.success = true;
          result.message = "find-password success";
          res.status(200).send(result);
        } else {
          throw { message: "서버: db 문제가 생김", status: 500 };
        }
      }
    );
  } catch (err) {
    res.status(err.status).send({ message: err.message });
  }
});

router.get("/:idx", (req, res) => {
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!accountIdx) {
      throw { message: "로그인 후 이용 가능", status: 401 };
    }

    // db 통신
    mariaDB.query(
      "SELECT * FROM account WHERE idx = ?",
      [accountIdx],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "서버: 계정정보가 존재하지 않음";
          res.status(404).send(result);
        } else if (rows.length === 1) {
          result.data = {
            id: rows[0].id,
            name: rows[0].name,
            nickname: rows[0].nickname,
            email: rows[0].email,
            password: rows[0].passowrd,
          };

          result.success = true;
          result.message = "get profile success";
          res.status(200).send(result);
        } else {
          throw { message: "서버: db 문제가 생김", status: 500 };
        }
      }
    );
  } catch (err) {
    res.status(err.status).send({ message: err.message });
  }
});

router.put("/", async (req, res) => {
  const { accountIdx } = req.session;
  const { name, nickname, email, password, passwordCheck } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!accountIdx) {
      throw { message: "로그인 후 이용 가능", status: 401 };
    }

    if (!regex.emailReg.test(email)) {
      throw { message: "invalid email input", status: 400 };
    }

    if (!regex.nameReg.test(name)) {
      throw { message: "invalid name input", status: 400 };
    }

    if (!regex.nicknameReg.test(nickname)) {
      throw { message: "invalid nickname input", status: 400 };
    }

    if (!regex.passwordReg.test(password)) {
      throw { message: "invalid password input", status: 400 };
    }

    if (!regex.passwordReg.test(passwordCheck)) {
      throw { message: "invalid passwordCheck input", status: 400 };
    }

    if (password != passwordCheck) {
      throw { message: "비밀번호가 일치하지 않습니다", status: 400 };
    }
    mariaDB.query(
      "SELECT * FROM account WHERE email = ?",
      [email],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 1 && rows[0].idx != accountIdx) {
          result.message = "서버: 해당 이메일 중복. 사용불가";
          res.status(409).send(result);
        } else {
          // 아이디와 이메일 모두 사용 가능. 테이블에 삽입.
          mariaDB.query(
            "UPDATE account SET email = ?, name = ?, nickname = ?, password = ? WHERE idx = ?",
            [email, name, nickname, password, accountIdx],
            (err, rows) => {
              if (err) {
                console.log("문제가 생겼음");
                result.message = err.sqlMessage;
                res.status(500).send(result);
              } else {
                console.log("문제 없음");
                result.message = "signup success";
                result.success = true;
                res.status(200).send(result);
              }
            }
          );
        }
      }
    );

    // db로 데이터 수정
    // mariaDB.query(
    //   "UPDATE notice_post SET email = ?, name = ?, nickname = ?, password = ? WHERE idx = ?",
    //   [email, name, nickname, password, accountIdx],
    //   (err, updatedRows) => {
    //     if (err) {
    //       result.message = err.sqlMessage;
    //       res.status(500).send(result);
    //     } else if (updatedRows.affectedRows === 0) {
    //       result.message = "서버: 존재하지 않는 계정";
    //       res.status(404).send(result);
    //     } else if (updatedRows.affectedRows === 1) {
    //       result.message = "edit profile success";
    //       result.success = true;
    //       res.status(200).send(result);
    //     } else {
    //       throw { message: "서버: db 문제가 생김", status: 500 };
    //     }
    //   }
    // );
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
  }
});

router.delete("/", (req, res) => {
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!accountIdx) {
      throw { message: "invalid session", status: 401 };
    }

    // db통신 -> 회원 정보 삭제
    mariaDB.query(
      "DELETE FROM account WHERE idx = ?",
      [accountIdx],
      (err, updatedRows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (updatedRows.affectedRows === 0) {
          result.message = "존재하지 않는 계정";
          res.status(404).send(result);
        } else if (updatedRows.affectedRows === 1) {
          req.session.destroy(function (err) {
            console.log("회원탈퇴 성공");
          });

          result.message = "delete success";
          result.success = true;
          res.status(200).send(result);
        } else {
          throw { message: "서버: db 문제가 생김", status: 500 };
        }
      }
    );
  } catch (err) {
    res.status(err.status).send({ message: err.message });
  }
});

module.exports = router;
