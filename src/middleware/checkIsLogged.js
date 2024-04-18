const checkIsLogged = (req, res, next) => {
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  if (!accountIdx) {
    result.message = "서버: 로그인 되어 있지 않음";
    res.status(401).send(result);
  } else {
    next();
  }
};

module.exports = { checkIsLogged };
