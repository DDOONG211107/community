// 04.29
// data와 데이터 처리는 항상 같이 만들어줘야 한다
// 로그 모듈에 사용할 데이터를 라우터 안에서 만들지 말기
// 200번 코드 말고는 전부 에러핸들러로 넘기기 (에러핸들러로 넘길때 상태코드도 같이 넘겨주고)

require("dotenv").config();

const express = require("express"); // express 패키지를 import
const session = require("express-session");
const app = express();
const result = require("./src/module/result");
const { Exception } = require("./src/module/Exception");

app.use(
  session({
    secret: "3AF874B5C209D264", // *알아볼 수 없는 난수값으로 설정해야 한다 (16진수 난수로)
    resave: false,
    saveUninitialized: false,

    cookie: { maxAge: 60 * 60 * 10 },
  })
);
app.use(express.json()); // object를 가지고 활용할 수 있게 해주는 코드

// 중요한 토픽 : interceptor 라는 것은 res.send의 오버라이딩
// 오버라이딩이라는 것은, 함수를 재정의 하는 것
// 오버라이딩을 등록하기만 하고 next로 router들로 흐름이 이동 함
const logger = require("./src/middleware/saveLogMongo");
app.use(logger);

// 1. 기존 api에서 통신 성공일 때 next 해주고 있는거 원래대로 돌려야 됨 ( 이게 올바른 방향 )
// 2. 모든 미들웨어, 라우터에서 발생하는 에러를 한 번에 처리해주려고 하는게 error handler middleware 임.
// ( 그냥 next와 return next의 차이를 좀 찾아볼 것 )

// const makeReqResultRouter = require("./src/routes/makeReqResultRouter");
// app.use(makeReqResultRouter);

// express에 미들웨어를 등록할 때 사용하는 명령어
const accountsRouter = require("./src/routes/accounts");
app.use("/accounts", accountsRouter);

const noticePostsRouter = require("./src/routes/notice-posts");
app.use("/notice-posts", noticePostsRouter);

const noticeCommentsRouter = require("./src/routes/notice-comments");
app.use("/notice-comments", noticeCommentsRouter);

const noticeLikeRouter = require("./src/routes/notice-like");
app.use("/notice-like", noticeLikeRouter);

const freePostsRouter = require("./src/routes/free-posts");
app.use("/free-posts", freePostsRouter);

const freeCommentsRouter = require("./src/routes/free-comments");
app.use("/free-comments", freeCommentsRouter);

const freeLikeRouter = require("./src/routes/free-like");
app.use("/free-like", freeLikeRouter);

const adminRouter = require("./src/routes/admin");
app.use("/admin", adminRouter);

app.use((err, req, res, next) => {
  req.isError = true;
  //console.log(err);
  if (err instanceof Exception) {
    console.log("exception!");
    req.code = err.code;
    req.result = result(null, err.message);
    return res.status(err.code).send(req.result);
  }

  console.log("error!");
  console.log(err); // 에러만 로깅
  if (err.code == 23503) {
    req.code = 404;
    req.result = result(null, "서버: 존재하지 않는 리소스에 접근 시도");
    return res.status(404).send(req.result);
  }

  req.code = 500;
  req.result = result(null, err.message);
  return res.status(500).send(req.result);
});

app.listen(8000, () => {
  console.log("8000번 포트에서 웹 서버 실행");
}); // 8000번 포트를 열어주는 명령어

// 1. Router 만드는건 기본 ( sql만 )
// 1-1. 각종 미들웨어

// 2. 에러 핸들러 미들웨어
// 3. res.send 인터셉터
// 4. 404 미들웨어
