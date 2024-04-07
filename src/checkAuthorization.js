const checkIsAdmin = (req, res, next) => {
  // 여기에 권한 체크 로직을 구현합니다.
  // 예를 들어, 세션을 사용하거나 토큰을 검증하여 사용자 권한을 확인합니다.
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

module.exports = { checkIsAdmin, checkIsLogged };
