const router = require("express").Router();

const regex = {
  idReg: /^[a-zA-Z0-9]{1,20}$/,
  passwordReg: /^[a-zA-Z0-9]{1,20}$/,
  nameReg: /^[가-힣a-zA-Z]{1,10}$/,
  nicknameReg: /^[가-힣a-zA-Z0-9]{1,10}$/,
  emailReg: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  titleReg: /^.{1,20}$/,
  postContentReg: /^.{1,500}$/,
  commentContentReg: /^.{1,200}$/,
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

    // 로그인이 성공했으므로 세션처리
    req.session.accountIdx = 1; // 실제로는 db에서 받아온 account.idx값을 넣어야 함

    result.message = "login success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
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

// id 중복확인 함수
async function checkId(id) {
  const response = {
    message: "",
    success: false,
  };
  try {
    if (!regex.idReg.test(id)) {
      throw "invalid id input";
    }

    // db통신 -> 아이디가 존재하는지 확인

    // if ("아이디가 존재할 경우") {
    //   throw "해당 아이디는 사용할 수 없습니다";
    // }

    response.message = "해당 아이디는 사용할 수 있습니다";
    response.success = true;

    return response;
  } catch (e) {
    response.message = e;
    return response;
  }
}

async function checkEmail(email) {
  const response = {
    message: "",
    success: false,
  };
  try {
    if (!regex.emailReg.test(email)) {
      throw "invalid email input";
    }

    // db통신 -> 이메일이 존재하는지 확인

    // if ("이메일이 존재할 경우") {
    //   throw "해당 이메일은 사용할 수 없습니다";
    // }

    response.message = "해당 이메일은 사용할 수 있습니다";
    response.success = true;

    return response;
  } catch (e) {
    response.message = e;
    return response;
  }
}

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

    const checkIdResult = await checkId(id);
    if (!checkIdResult.success) {
      throw { message: checkIdResult.message, status: 400 };
    }

    const checkEmailResult = await checkEmail(email);
    if (!checkEmailResult.success) {
      throw { message: checkEmailResult.message, status: 400 };
    }

    // db로 데이터 삽입

    // 성공했다고 가정
    result.success = true;
    result.message = "signup success";
    res.status(200).send(result);
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
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
    // db:계정 정보가 틀렸을 경우
    if (!email) {
      throw "회원정보와 일치하는 아이디가 없습니다.";
    }

    result.data = { id: "testid" }; // 원래 db에서 받아와야 하는 값
    result.success = true;
    result.message = "find-id success";
    res.status(200).send(result);
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
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

    result.data = { password: "1234" }; // 원래 db에서 받아와야 하는 값
    result.success = true;
    result.message = "find-password success";
    res.status(200).send(result);
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
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

    result.data = {
      id: "testid",
      name: "테스트이름",
      nickname: "테스트닉네임",
      email: "test@test.com",
      password: "1234",
    }; // 원래 db에서 받아와야 하는 값

    result.success = true;
    result.message = "get profile success";
    res.status(200).send(result);
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
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

    const checkEmailResult = await checkEmail(email);
    if (!checkEmailResult.success) {
      throw { message: checkEmailResult.message, status: 400 };
    }

    // db로 데이터 수정

    // 성공했다고 가정
    result.success = true;
    result.message = "update profile success";
    res.status(200).send(result);
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

    req.session.destroy(function (err) {
      console.log("회원탈퇴 성공");
    });
    result.message = "delete account success";
    result.success = true;

    res.status(200).send(result);
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message });
  }
});

module.exports = router;
