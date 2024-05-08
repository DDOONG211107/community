const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");
// checkIsLogin으로 이름 바꾸는게 낫다
const checkIsLogin = (req, res, next) => {
  // const { accountIdx } = req.session.user;
  const accountIdx = req.session?.user?.accountIdx;
  console.log(accountIdx);
  if (!accountIdx) {
    throw new Exception(403, "로그인 되어있지 않음");
  }
  next();
};

module.exports = { checkIsLogin };
