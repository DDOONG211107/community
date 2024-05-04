const router = require("express").Router();
const { pgPool } = require("../database/postgreSQL");
const { checkIsLogin } = require("../middleware/checkIsLogin");
const { Comment_content, validate } = require("../middleware/validate");
const result = require("../module/result");
const wrapper = require("../module/wrapper");
const { Exception } = require("../module/Exception");

// 댓글 목록 불러오기 api
router.get(
  "/",
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { notice_idx } = req.body; // 불러와야 하는 공지글의 idx

    if (!notice_idx) {
      req.code = 404;
      throw new Exception(404, "게시글 정보 없음");
    }

    const selectResult = await pgPool.query(
      `
          SELECT notice_board.comment.*, account.list.nickname,
              CASE WHEN notice_board.comment.account_idx = $1 
              THEN true ELSE false END AS is_mine
          FROM notice_board.comment 
          JOIN account.list 
          ON notice_board.comment.account_idx = account.list.idx
          WHERE notice_board.comment.list_idx = $2;
    `,
      [accountIdx, notice_idx]
    );
    const comments = selectResult.rows;

    req.code = 200;
    req.result = result({ comments: comments });
    res.status(req.code).send(req.result);
  })
);

router.post(
  "/",
  [Comment_content, validate],
  checkIsLogin,
  wrapper(async (req, res, next) => {
    const { accountIdx } = req.session;
    const { content, notice_idx } = req.body;

    if (!notice_idx) {
      throw new Exception(404, "게시글 정보 없음");
    }

    await pgPool.query(
      `
      INSERT INTO notice_board.comment (content, list_idx, account_idx)
      VALUES ($1, $2, $3) RETURNING idx;
    `,
      [content, notice_idx, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

router.put(
  "/:comment_idx",
  [Comment_content, validate],
  wrapper(async (req, res, next) => {
    const { comment_idx } = req.params;
    const { accountIdx } = req.session;
    const { content } = req.body;

    if (!comment_idx) {
      req.code = 404;
      throw new Exception(404, "댓글 정보 존재하지 않음");
    }

    await pgPool.query(
      `
        UPDATE notice_board.comment SET content = $1 
        WHERE idx = $2 AND account_idx = $3 RETURNING idx
    `,
      [content, comment_idx, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

router.delete(
  "/:comment_idx",
  wrapper(async (req, res, next) => {
    const { comment_idx } = req.params;
    const { accountIdx } = req.session;

    if (!comment_idx) {
      req.code = 404;
      throw new Exception(404, "댓글 정보 존재하지 않음");
    }

    await pgPool.query(
      `
          DELETE FROM notice_board.comment 
          WHERE idx = $1 AND account_idx = $2 RETURNING idx;
      `,
      [comment_idx, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

module.exports = router;
