// checkIsLogin으로 이름 바꾸는게 낫다
const checkIsLogged = (req, res, next) => {
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  if (!accountIdx) {
    req.code = 403;
    result.message = "서버: 로그인되어 있지 않음";
    next({ code: 403 });
  } else {
    next();
  }
};

module.exports = { checkIsLogged };
