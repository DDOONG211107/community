const router = require("express").Router();

router.use((req, res, next) => {
  req.result = { message: "Success" };
  next();
});

// undefined: 진짜로 개발자도 정의를 안 한 것,
// null: 개발자가 정의는했는데 빈 값으로 넣고 싶을 때
// "": 공백 문자열 (비어있다고 표현되는것이 아님)

module.exports = router;
