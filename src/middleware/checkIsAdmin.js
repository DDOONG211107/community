const checkIsAdmin = (req, res, next) => {
  const { role } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  if (role != 1) {
    result.message = "서버: 공지글 작성 권한 없음";
    res.status(403).send(result);
  } else {
    next();
  }
};

module.exports = { checkIsAdmin };
