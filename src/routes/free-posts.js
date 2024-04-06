const router = require("express").Router();
const mariaDB = require("../maria");

const regex = {
  titleReg: /^.{1,20}$/,
  postContentReg: /^.{1,500}$/,
};

// 게시글 목록 불러오기
router.get("/", (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };

  // db통신 -> 게시판 글 목록 불러오기
  mariaDB.query("SELECT * FROM free_post", (err, rows) => {
    if (err) {
      result.message = err.sqlMessage;
      res.status(500).send(result);
    } else {
      result.message = "get free-posts success";
      result.data = { postsList: rows };
      result.success = true;
      res.status(200).send(result);
    }
  });
});

// 게시글 불러오는 api
router.get("/:free", (req, res) => {
  const { free } = req.params;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!free) {
      throw { message: "게시글 idx 없음", status: 404 };
    }

    // db통신 -> 게시판 글 목록 불러오기
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
        } else {
          result.message = "get free-posts success";
          result.data = { post: rows[0] };
          result.success = true;
          res.status(200).send(result);
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

// 게시글 작성 api
router.post("/", (req, res) => {
  const { accountIdx } = req.session;
  const { title, content } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!accountIdx) {
      throw { message: "로그인 후 이용", status: 401 };
    }

    if (!regex.titleReg.test(title)) {
      throw { message: "invalid title size", status: 400 };
    }

    if (!regex.postContentReg.test(content)) {
      throw { message: "invalid content size", status: 400 };
    }
    // db통신 -> 게시판 글 삽입하기
    mariaDB.query(
      "INSERT INTO free_post (title, content, account_idx) VALUES (?, ?, ?)",
      [title, content, accountIdx],
      (err, rows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else {
          result.message = "create post success";
          result.success = true;
          res.status(200).send(result);
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

// 게시글 수정 api
router.put("/:free", (req, res) => {
  const { free } = req.params;
  const { accountIdx } = req.session;
  const { title, content, postWriterIdx } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!free) {
      throw { message: "존재하지 않는 게시글", status: 404 };
    }

    if (accountIdx != postWriterIdx) {
      throw { message: "not authorized: 게시글 수정", status: 401 };
    }

    if (!regex.titleReg.test(title)) {
      throw { message: "invalid title size", status: 400 };
    }

    if (!regex.postContentReg.test(content)) {
      throw { message: "invalid content size", status: 400 };
    }
    // db통신 -> 게시판 글 수정하기
    mariaDB.query(
      "UPDATE free_post SET title = ?, content = ? WHERE idx = ?",
      [title, content, free],
      (err, updatedRows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (updatedRows.affectedRows === 0) {
          result.message = "존재하지 않는 게시글";
          res.status(404).send(result);
        } else if (updatedRows.affectedRows === 1) {
          result.message = "edit post success";
          result.success = true;
          res.status(200).send(result);
        } else {
          result.message = "서버: 게시글 수정 실패";
          res.status(500).send(result);
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

// 게시글 삭제 api
router.delete("/:free", (req, res) => {
  const { free } = req.params;
  const { accountIdx } = req.session;
  const { postWriterIdx } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!free) {
      throw { message: "존재하지 않는 게시글", status: 404 };
    }

    if (accountIdx != postWriterIdx) {
      throw { message: "not authorized: 게시글 삭제", status: 401 };
    }

    // db통신 -> 게시글 삭제하기
    mariaDB.query(
      "DELETE FROM free_post WHERE idx = ?",
      [free],
      (err, deletedRows) => {
        if (err) {
          result.message = err.sqlMessage;
          res.status(500).send(result);
        } else if (deletedRows.affectedRows === 0) {
          result.message = "존재하지 않는 게시글";
          res.status(404).send(result);
        } else if (deletedRows.affectedRows === 1) {
          result.message = "delete post success";
          result.success = true;
          res.status(200).send(result);
        } else {
          throw { message: "서버: 게시글 삭제 실패", status: 500 };
        }
      }
    );
  } catch (err) {
    result.message = err.message;
    res.status(err.status).send(result);
  }
});

module.exports = router;
