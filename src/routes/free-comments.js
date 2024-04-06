const router = require("express").Router();
const mariaDB = require("../maria");

const regex = {
  commentContentReg: /^.{1,200}$/,
};

// 댓글 목록 불러오기 api
router.get("/", (req, res) => {
  const { free } = req.body; // 불러와야 하는 자유게시판 글의 idx

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!free) {
      throw { message: "게시글 idx 없음", status: 404 };
    }

    // db통신 -> 댓글 목록 불러오기
    mariaDB.query(
      "SELECT * FROM free_post WHERE idx = ?",
      [free],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "게시글 idx 없음";
          res.status(404).send(result);
        } else if (rows.length === 1) {
          // db통신 -> 댓글 목록 불러오기
          mariaDB.query(
            "SELECT * FROM free_comment WHERE post_idx = ?",
            [free],
            (err, rows) => {
              if (err) {
                result.message = err.sqlMessage;
                res.status(500).send(result);
              } else {
                result.message = "get free-comments success";
                result.data = { commentsList: rows };
                result.success = true;
                res.status(200).send(result);
              }
            }
          );
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

router.post("/", (req, res) => {
  const { accountIdx } = req.session;
  const { content, free } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!free) {
      throw { message: "게시글 idx 없음", status: 404 };
    }

    if (!accountIdx) {
      throw { message: "로그인 후 이용", status: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", status: 400 };
    }

    // db통신 -> 댓글 작성하기
    mariaDB.query(
      "SELECT * FROM free_post WHERE idx = ?",
      [free],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "존재하지 않는 게시글";
          res.status(404).send(result);
        } else if (rows.length > 1) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 1) {
          // 이제서야 댓글 작성하기
          mariaDB.query(
            "INSERT INTO free_comment (content, post_idx, account_idx) VALUES (?, ?, ?)",
            [content, free, accountIdx],
            (err, rows) => {
              if (err) {
                result.message = err.sqlMessage;
                res.status(500).send(result);
              } else {
                result.message = "create free-comment success";
                result.success = true;
                res.status(200).send(result);
              }
            }
          );
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

router.put("/:comment", (req, res) => {
  const { comment } = req.params;
  const { accountIdx } = req.session;
  const { content, commentWriterIdx, free } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!free) {
      throw { message: "게시글 idx 없음", status: 404 };
    }

    if (!comment) {
      throw { message: "댓글 idx 없음", status: 404 };
    }

    if (accountIdx != commentWriterIdx) {
      throw { message: "not authorized:댓글 수정", status: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", status: 400 };
    }
    // db통신 -> 댓글 수정하기
    mariaDB.query(
      "SELECT * FROM free_comment WHERE idx = ?",
      [comment],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "존재하지 않는 댓글";
          res.status(404).send(result);
        } else if (rows.length > 1) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
          // 이제 비로소 댓글 수정
        } else if (rows.length === 1) {
          console.log("여기 들어오긴 한다");
          mariaDB.query(
            "UPDATE free_comment SET content = ? WHERE idx = ?",
            [content, comment],
            (err, updatedRows) => {
              console.log(content);
              if (err) {
                result.message = err.sqlMessage;
                res.status(500).send(result);
              } else if (updatedRows.affectedRows === 0) {
                console.log(404, content);

                result.message = "서버: 댓글 수정 실패";
                res.status(404).send(result);
              } else if (updatedRows.affectedRows === 1) {
                console.log(200, content);

                result.message = "댓글 수정 성공";
                result.success = true;
                res.status(200).send(result);
              } else {
                result.message = "서버: 댓글 수정 실패";
                res.status(500).send(result);
              }
            }
          );
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

router.delete("/:comment", (req, res) => {
  const { comment } = req.params;
  const { accountIdx } = req.session;
  const { content, commentWriterIdx, free } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!free) {
      throw { message: "게시글 idx 없음", status: 404 };
    }

    if (!comment) {
      throw { message: "댓글 idx 없음", status: 404 };
    }

    if (accountIdx != commentWriterIdx) {
      throw { message: "not authorized:댓글 삭제", status: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", status: 400 };
    }

    // db통신 -> 댓글 삭제하기
    mariaDB.query(
      "SELECT * FROM free_comment WHERE idx = ?",
      [comment],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (rows.length === 0) {
          result.message = "존재하지 않는 댓글";
          res.status(404).send(result);
        } else if (rows.length > 1) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
          // 이제 비로소 댓글 수정
        } else if (rows.length === 1) {
          mariaDB.query(
            "DELETE FROM free_comment WHERE idx = ?",
            [comment],
            (err, updatedRows) => {
              if (err) {
                result.message = err.sqlMessage;
                res.status(500).send(result);
              } else if (updatedRows.affectedRows === 0) {
                result.message = "서버: 댓글 삭제 실패";
                res.status(404).send(result);
              } else if (updatedRows.affectedRows === 1) {
                result.message = "댓글 삭제 성공";
                result.success = true;
                res.status(200).send(result);
              } else {
                result.message = "서버: 댓글 삭제 실패";
                res.status(500).send(result);
              }
            }
          );
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

module.exports = router;
