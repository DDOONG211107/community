const checkIsLogged = (req, res, next) => {
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  if (!accountIdx) {
    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      name: "middleware/checkIsLogged",
      rest: undefined,
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 403,
    };
    result.message = "서버: 로그인되어있지 않음";
    res.log = log;

    return res.status(403).send(result);
  } else {
    next();
  }
};

module.exports = { checkIsLogged };
