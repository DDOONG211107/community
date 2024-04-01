const express = require("express"); // express 패키지를 import
const session = require("express-session");

const app = express();

app.use(
  session({
    secret: "3AF874B5C209D264", // *알아볼 수 없는 난수값으로 설정해야 한다 (16진수 난수로)
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 10 },
  })
);
app.use(express.json()); // object를 가지고 활용할 수 있게 해주는 코드

// express에 미들웨어를 등록할 때 사용하는 명령어
const accountsRouter = require("./src/routes/accounts");
app.use("/accounts", accountsRouter);

const postsRouter = require("./src/routes/posts");
app.use("/posts", postsRouter);

const commentsRouter = require("./src/routes/comments");
app.use("/comments", commentsRouter);

app.listen(8000, () => {
  console.log("8000번 포트에서 웹 서버 실행");
}); // 8000번 포트를 열어주는 명령어
