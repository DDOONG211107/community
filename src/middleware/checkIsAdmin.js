const checkIsAdmin = (req, res, next) => {
  const { role } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  if (role != 1) {
    req.code = 403;
    result.message = "서버: 관리자 권한 없음";
    next({ code: 403 });
  } else {
    next();
  }
};

module.exports = { checkIsAdmin };
