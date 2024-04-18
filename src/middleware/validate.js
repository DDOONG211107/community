// 이름 질문: 이렇게 바꿔서 써도 되나?
const { validationResult, body: validateBody } = require("express-validator");

const regex = {
  idReg: /^[a-zA-Z0-9]{1,20}$/,
  passwordReg: /^[a-zA-Z0-9]{1,20}$/,
  nameReg: /^[가-힣a-zA-Z]{1,10}$/,
  nicknameReg: /^[가-힣a-zA-Z0-9]{1,10}$/,
  emailReg: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  titleReg: /^.{1,20}$/,
  postContentReg: /^.{1,500}$/,
  commentContentReg: /^.{1,200}$/,
  warningString: "서버: invalid input",
};

const validate = (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    res.status(400).send({ message: regex.warningString });
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
};
