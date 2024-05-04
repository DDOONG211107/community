const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");

const checkIsAdmin = wrapper((req, res, next) => {
  const { role } = req.session;

  if (role != 1) {
    throw new Exception(403, "관리자 권한 없음");
  }
  next();
});

module.exports = { checkIsAdmin };
