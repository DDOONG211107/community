const express = require("express"); // express 패키지를 import
const session = require("express-session");

const app = express();

app.use(
  session({
    secret: "ddoong03",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.json()); // object를 가지고 활용할 수 있게 해주는 코드

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

app.get("/mainpage", (req, res) => {
  res.sendFile(`${__dirname}/src/main.html`); // 현재파일까지의 절대경로를 계산 + 파일을 보낼 경로를 지정
});

app.post("/accounts/login", (req, res) => {
  const { id, password } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.idReg.test(id)) {
      throw "invalid id input";
    }

    if (!regex.passwordReg.test(password)) {
      throw "invalid pw input";
    }

    // db로 로그인 정보 확인
    // db:계정 정보가 틀렸을 경우
    if (!id) {
      throw "아이디 또는 비밀번호를 확인해주세요";
    }

    // 로그인이 성공했으므로 세션처리
    req.session.accountIdx = 1; // 실제로는 db에서 받아온 account.idx값을 넣어야 함

    result.message = "login success";
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e;
    res.status(400).send(result);
  }
});

app.delete("/accounts/logout", (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    delete req.session;
    result.message = "logout success";
    result.success = true;

    res.send(result);
  } catch (e) {
    result.message = e;
    res.status(500).send(result);
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

app.post("/accounts", async (req, res) => {
  const { id, email, name, nickname, password, passwordCheck } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.idReg.test(id)) {
      throw { message: "invalid id input", code: 400 };
    }

    if (!regex.emailReg.test(email)) {
      throw { message: "invalid email input", code: 400 };
    }

    if (!regex.nameReg.test(name)) {
      throw { message: "invalid name input", code: 400 };
    }

    if (!regex.nicknameReg.test(nickname)) {
      throw { message: "invalid nickname input", code: 400 };
    }

    if (!regex.passwordReg.test(password)) {
      throw { message: "invalid password input", code: 400 };
    }

    if (!regex.passwordReg.test(passwordCheck)) {
      throw { message: "invalid passwordCheck input", code: 400 };
    }

    if (password != passwordCheck) {
      throw { message: "비밀번호가 일치하지 않습니다", code: 400 };
    }

    const checkIdResult = await checkId(id);
    console.log(checkIdResult);
    if (!checkIdResult.success) {
      throw { message: checkIdResult.message, code: 400 };
    }

    const checkEmailResult = await checkEmail(email);
    console.log(checkEmailResult);
    if (!checkEmailResult.success) {
      throw { message: checkEmailResult.message, code: 400 };
    }

    // db로 데이터 삽입

    // 성공했다고 가정
    result.success = true;
    result.message = "signup success";
    res.send(result);
  } catch (e) {
    console.log(e);
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // 입력값 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

app.get("/accounts/find-id", (req, res) => {
  const { email, name } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.emailReg.test(email)) {
      throw "invalid email input";
    }

    if (!regex.nameReg.test(name)) {
      throw "invalid name input";
    }

    // db로 아이디 정보 확인
    // db:계정 정보가 틀렸을 경우
    if (!email) {
      throw "회원정보와 일치하는 아이디가 없습니다.";
    }

    result.data = { id: "testid" }; // 원래 db에서 받아와야 하는 값
    result.success = true;
    result.message = "find-id success";
    res.send(result);
  } catch (e) {
    result.message = e;
    res.status(400).send(result);
  }
});

app.get("/accounts/find-password", (req, res) => {
  const { email, id } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!regex.emailReg.test(email)) {
      throw "invalid email input";
    }

    if (!regex.idReg.test(id)) {
      throw "invalid id input";
    }

    // db로 비밀번호 정보 확인
    // db:계정 정보가 틀렸을 경우
    if (!email) {
      throw "회원정보와 일치하는 비밀번호가 없습니다.";
    }

    result.data = { password: "1234" }; // 원래 db에서 받아와야 하는 값
    result.success = true;
    result.message = "find-password success";
    res.send(result);
  } catch (e) {
    result.message = e;
    res.status(400).send(result);
  }
});

app.get("/accounts/:idx", (req, res) => {
  const { idx } = req.params;
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!accountIdx) {
      throw "로그인 후 이용가능";
    }

    // 이렇게 쓰는거 맞나????
    if (accountIdx != idx) {
      throw "invalid session idx";
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
    res.send(result);
  } catch (e) {
    result.message = e;
    res.status(401).send(result);
  }
});

app.put("/accounts/:idx", async (req, res) => {
  const { idx } = req.params;
  const { accountIdx } = req.session;
  const { name, nickname, email, password, passwordCheck } = req.body;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!accountIdx) {
      throw { message: "로그인 후 이용 가능", code: 401 };
    }

    if (accountIdx != idx) {
      throw { message: "invalid session idx", code: 401 };
    }

    if (!regex.emailReg.test(email)) {
      throw { message: "invalid email input", code: 400 };
    }

    if (!regex.nameReg.test(name)) {
      throw { message: "invalid name input", code: 400 };
    }

    if (!regex.nicknameReg.test(nickname)) {
      throw { message: "invalid nickname input", code: 400 };
    }

    if (!regex.passwordReg.test(password)) {
      throw { message: "invalid password input", code: 400 };
    }

    if (!regex.passwordReg.test(passwordCheck)) {
      throw { message: "invalid passwordCheck input", code: 400 };
    }

    if (password != passwordCheck) {
      throw { message: "비밀번호가 일치하지 않습니다", code: 400 };
    }

    const checkEmailResult = await checkEmail(email);
    if (!checkEmailResult.success) {
      throw { message: checkEmailResult.message, code: 400 };
    }

    // db로 데이터 수정

    // 성공했다고 가정
    result.success = true;
    result.message = "update profile success";
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // 세션 또는 입력값 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

app.delete("/accounts/:idx", (req, res) => {
  const { idx } = req.params;
  const { accountIdx } = req.session;
  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (accountIdx != idx) {
      throw { message: "invalid session", code: 401 };
    }

    // db통신 -> 회원 정보 삭제

    delete req.session;
    result.message = "delete account success";
    result.success = true;

    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // 세션 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

// 게시글 목록 불러오기
app.get("/posts", (req, res) => {
  const { board } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    // db통신 -> 게시판 글 목록 불러오기

    result.message = "get posts success";
    result.data = {
      // 실제로는 db에서 가져와야 하는 데이터
      postList: [
        { idx: 1, title: "test title1", creationTime: "2024-03-31T11:22:33" },
        { idx: 2, title: "test title2", creationTime: "2024-03-31T11:22:44" },
        { idx: 3, title: "test title3", creationTime: "2024-03-31T11:33:44" },
        { idx: 4, title: "test title4", creationTime: "2024-03-31T11:33:55" },
        { idx: 5, title: "test title5", creationTime: "2024-03-31T11:44:22" },
      ],
    };
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // url(?) 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

// 게시글 불러오는 api
app.get("/posts/:post", (req, res) => {
  const { post } = req.params;
  const { board } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    // db통신 -> 게시판 글 목록 불러오기

    result.message = "get post success";
    result.data = {
      idx: 1,
      title: "test title1",
      content: "test content1",
      accountIdx: 1,
      creationTime: "2024-03-31T11:22:44",
    };
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // url 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

// 게시글 작성 api
app.post("/posts", (req, res) => {
  const { accountIdx } = req.session;
  const { title, content, board } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!accountIdx) {
      throw { message: "로그인 후 이용", code: 401 };
    }

    if (!regex.titleReg.test(title)) {
      throw { message: "invalid title size", code: 400 };
    }

    if (!regex.postContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 게시판 글 삽입하기

    result.message = "create post success";
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // url 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

// 게시글 수정 api
app.put("/posts/:post", (req, res) => {
  const { post } = req.params;
  const { accountIdx } = req.session;
  const { board, title, content, postWriterIdx } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "존재하지 않는 게시글", code: 404 };
    }

    if (accountIdx != postWriterIdx) {
      throw { message: "not authorized: 게시글 수정", code: 401 };
    }

    if (!regex.titleReg.test(title)) {
      throw { message: "invalid title size", code: 400 };
    }

    if (!regex.postContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 게시판 글 수정하기

    result.message = "edit post success";
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // 세션 또는 url 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

// 게시글 삭제 api
app.delete("/posts/:post", (req, res) => {
  const { post } = req.params;
  const { accountIdx } = req.session;
  const { postWriterIdx, board } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "존재하지 않는 게시글", code: 404 };
    }

    if (accountIdx != postWriterIdx) {
      throw { message: "not authorized: 게시글 삭제", code: 401 };
    }

    // db통신 -> 게시글 삭제하기

    result.message = "delete post success";
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // 세션 또는 url 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

// 댓글 목록 불러오기 api
app.get("/comments", (req, res) => {
  const { board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    // db통신 -> 댓글 목록 불러오기

    result.message = "get comments success";
    result.data = {
      // 실제로는 db에서 가져와야 하는 데이터
      commentList: [
        {
          idx: 1,
          content: "test content1",
          creationTime: "2024-03-31T11:22:33",
        },
        {
          idx: 2,
          content: "test content2",
          creationTime: "2024-03-31T11:22:44",
        },
        {
          idx: 3,
          content: "test content3",
          creationTime: "2024-03-31T11:22:55",
        },
      ],
    };
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // url(?) 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

app.post("/comments", (req, res) => {
  const { accountIdx } = req.session;
  const { content, board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    if (!accountIdx) {
      throw { message: "로그인 후 이용", code: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 댓글 작성하기

    result.message = "create comment success";
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // url 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

app.put("/comments/:comment", (req, res) => {
  const { comment } = req.params;
  const { accountIdx } = req.session;
  const { content, commentWriterIdx, board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    if (!comment) {
      throw { message: "댓글 idx 없음", code: 404 };
    }

    if (accountIdx != commentWriterIdx) {
      throw { message: "not authorized:댓글 수정", code: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 댓글 수정하기

    result.message = "edit comment success";
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // url 또는 세션 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

app.delete("/comments/:comment", (req, res) => {
  const { comment } = req.params;
  const { accountIdx } = req.session;
  const { content, commentWriterIdx, board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    if (!comment) {
      throw { message: "댓글 idx 없음", code: 404 };
    }

    if (accountIdx != commentWriterIdx) {
      throw { message: "not authorized:댓글 삭제", code: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }

    // db통신 -> 댓글 삭제하기

    result.message = "delete comment success";
    result.success = true;
    res.send(result);
  } catch (e) {
    result.message = e.message;
    if (e.code) {
      res.status(e.code).send(result); // url 또는 세션 오류
    } else {
      res.status(500).send(result); // db통신중 오류
    }
  }
});

app.listen(8000, () => {
  console.log("8000번 포트에서 웹 서버 실행");
}); // 8000번 포트를 열어주는 명령어
