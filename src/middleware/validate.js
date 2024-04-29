// 이름 질문: 이렇게 바꿔서 써도 되나?
const { validationResult, body: validateBody } = require("express-validator");

const regex = {
  idReg: /^[a-zA-Z0-9]{0,20}$/,
  passwordReg: /^[a-zA-Z0-9]{1,20}$/,
  nameReg: /^[가-힣a-zA-Z]{1,10}$/,
  nicknameReg: /^[가-힣a-zA-Z0-9]{1,10}$/,
  emailReg: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  titleReg: /^.{1,20}$/,
  postContentReg: /^.{1,500}$/,
  commentContentReg: /^.{1,200}$/,
  dateReg: /^(|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})$/,
  successReg: /^[a-zA_Z]{4,5}$/,
  warningString: "서버: invalid input",
};

const validate = (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const result = {
      success: false,
      message: "",
      data: null,
    };
    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : undefined,
      name: "middleware/validate",
      rest: undefined,
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 400,
    };

    result.message = regex.warningString;
    res.log = log;

    return res.status(400).send(result);
  } else {
    next();
  }
};

const Id = validateBody("id").matches(regex.idReg);
const Password = validateBody("password").matches(regex.passwordReg);
const PasswordCheck = validateBody("passwordCheck").matches(regex.passwordReg);
const Name = validateBody("name").matches(regex.nameReg);
const Nickname = validateBody("nickname").matches(regex.nicknameReg);
const Email = validateBody("email").matches(regex.emailReg);

const Title = validateBody("title").matches(regex.titleReg);
const Post_content = validateBody("content").matches(regex.postContentReg);
const Comment_content = validateBody("content").matches(
  regex.commentContentReg
);
const StartDate = validateBody("startDateString").matches(regex.dateReg);
const EndDate = validateBody("endDateString").matches(regex.dateReg);
const Success = validateBody("success").matches(regex.successReg);
module.exports = {
  validate,
  Title,
  Post_content,
  Comment_content,
  Id,
  Password,
  PasswordCheck,
  Name,
  Nickname,
  Email,
  StartDate,
  EndDate,
  Success,
};
