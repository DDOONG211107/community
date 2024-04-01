const router = require("express").Router();

// 댓글 목록 불러오기 api
router.get("/comments", (req, res) => {
  const { board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    // db통신 -> 댓글 목록 불러오기

    result.message = "get comments success";
    result.data = {
      // 실제로는 db에서 가져와야 하는 데이터
      commentList: [
        {
          idx: 1,
          content: "test content1",
          creationTime: "2024-03-31T11:22:33",
        },
        {
          idx: 2,
          content: "test content2",
          creationTime: "2024-03-31T11:22:44",
        },
        {
          idx: 3,
          content: "test content3",
          creationTime: "2024-03-31T11:22:55",
        },
      ],
    };
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

router.post("/comments", (req, res) => {
  const { accountIdx } = req.session;
  const { content, board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    if (!accountIdx) {
      throw { message: "로그인 후 이용", code: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 댓글 작성하기

    result.message = "create comment success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

router.put("/comments/:comment", (req, res) => {
  const { comment } = req.params;
  const { accountIdx } = req.session;
  const { content, commentWriterIdx, board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    if (!comment) {
      throw { message: "댓글 idx 없음", code: 404 };
    }

    if (accountIdx != commentWriterIdx) {
      throw { message: "not authorized:댓글 수정", code: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 댓글 수정하기

    result.message = "edit comment success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

router.delete("/comments/:comment", (req, res) => {
  const { comment } = req.params;
  const { accountIdx } = req.session;
  const { content, commentWriterIdx, board, post } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!post) {
      throw { message: "게시글 idx 없음", code: 404 };
    }

    if (!comment) {
      throw { message: "댓글 idx 없음", code: 404 };
    }

    if (accountIdx != commentWriterIdx) {
      throw { message: "not authorized:댓글 삭제", code: 401 };
    }

    if (!regex.commentContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }

    // db통신 -> 댓글 삭제하기

    result.message = "delete comment success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

module.exports = router;
