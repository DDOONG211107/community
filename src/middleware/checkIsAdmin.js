const checkIsAdmin = (req, res, next) => {
  const { role } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  if (role != 1) {
    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      name: "middleware/checkIsAdmin",
      rest: undefined,
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 403,
    };
    result.message = "서버: 관리자 권한 없음";
    res.log = log;

    return res.status(403).send(result);
  } else {
    next();
  }
};

module.exports = { checkIsAdmin };
