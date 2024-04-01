const router = require("express").Router();

// 게시글 목록 불러오기
router.get("/", (req, res) => {
  const { board } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    // db통신 -> 게시판 글 목록 불러오기

    result.message = "get posts success";
    result.data = {
      // 실제로는 db에서 가져와야 하는 데이터
      postList: [
        { idx: 1, title: "test title1", creationTime: "2024-03-31T11:22:33" },
        { idx: 2, title: "test title2", creationTime: "2024-03-31T11:22:44" },
        { idx: 3, title: "test title3", creationTime: "2024-03-31T11:33:44" },
        { idx: 4, title: "test title4", creationTime: "2024-03-31T11:33:55" },
        { idx: 5, title: "test title5", creationTime: "2024-03-31T11:44:22" },
      ],
    };
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

// 게시글 불러오는 api
router.get("/:post", (req, res) => {
  const { post } = req.params;
  const { board } = req.body;

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

    // db통신 -> 게시판 글 목록 불러오기

    result.message = "get post success";
    result.data = {
      idx: 1,
      title: "test title1",
      content: "test content1",
      accountIdx: 1,
      creationTime: "2024-03-31T11:22:44",
    };
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

// 게시글 작성 api
router.post("/", (req, res) => {
  const { accountIdx } = req.session;
  const { title, content, board } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  try {
    if (!board) {
      throw { message: "게시판 idx 없음", code: 404 };
    }

    if (!accountIdx) {
      throw { message: "로그인 후 이용", code: 401 };
    }

    if (!regex.titleReg.test(title)) {
      throw { message: "invalid title size", code: 400 };
    }

    if (!regex.postContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 게시판 글 삽입하기

    result.message = "create post success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

// 게시글 수정 api
router.put("/:post", (req, res) => {
  const { post } = req.params;
  const { accountIdx } = req.session;
  const { board, title, content, postWriterIdx } = req.body;

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
      throw { message: "존재하지 않는 게시글", code: 404 };
    }

    if (accountIdx != postWriterIdx) {
      throw { message: "not authorized: 게시글 수정", code: 401 };
    }

    if (!regex.titleReg.test(title)) {
      throw { message: "invalid title size", code: 400 };
    }

    if (!regex.postContentReg.test(content)) {
      throw { message: "invalid content size", code: 400 };
    }
    // db통신 -> 게시판 글 수정하기

    result.message = "edit post success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

// 게시글 삭제 api
router.delete("/:post", (req, res) => {
  const { post } = req.params;
  const { accountIdx } = req.session;
  const { postWriterIdx, board } = req.body;

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
      throw { message: "존재하지 않는 게시글", code: 404 };
    }

    if (accountIdx != postWriterIdx) {
      throw { message: "not authorized: 게시글 삭제", code: 401 };
    }

    // db통신 -> 게시글 삭제하기

    result.message = "delete post success";
    result.success = true;
    res.status(200).send(result);
  } catch (err) {
    result.message = err.message;
    res.status(err.code || 500).send(result);
  }
});

module.exports = router;
