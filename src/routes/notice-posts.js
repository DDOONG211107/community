const router = require("express").Router();
const wrapper = require("../module/wrapper");
const { Exception } = require("../module/Exception");
const { pgPool } = require("../database/postgreSQL");
const { checkIsAdmin } = require("../middleware/checkIsAdmin");
const { Title, Post_content, validate } = require("../middleware/validate");
const result = require("../module/result");

// 게시글 목록 불러오기
router.get(
  "/",
  wrapper(async (req, res, next) => {
    const selectedResult = await pgPool.query(`
      SELECT 
          notice_board.list.idx, notice_board.list.title,
          account.list.nickname, notice_board.list.like_count,
          notice_board.list.created_at 
      FROM account.list
      JOIN notice_board.list ON account.list.idx = notice_board.list.account_idx
      ORDER BY idx;
      `);
    const posts = selectedResult.rows;

    req.code = 200;
    req.result = result({ posts: posts });
    res.status(200).send(req.result);
  })
);

router.get(
  "/:notice_idx",
  wrapper(async (req, res, next) => {
    const { accountIdx } = req.session;
    const { notice_idx } = req.params;

    if (!notice_idx) {
      req.code = 404;
      throw new Exception(404, "게시글 정보 없음");
    }

    const selectedResult = await pgPool.query(
      `
        SELECT notice_board.list.*, account.list.nickname,
            CASE WHEN notice_board.list.account_idx = $1 
            THEN true ELSE false END AS is_mine
        FROM account.list 
        JOIN notice_board.list ON account.list.idx = notice_board.list.account_idx
        WHERE notice_board.list.idx = $2;
    `,
      [accountIdx, notice_idx]
    );

    const post = selectedResult.rows[0];

    if (!post) {
      req.code = 404;
      throw new Exception(404, "존재하지 않는 게시글");
    }

    req.code = 200;
    req.result = result({ post: post });
    res.status(200).send(req.result);
  })
);

// 게시글 작성 api
router.post(
  "/",
  [Title, Post_content, validate],
  checkIsAdmin,
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { title, content } = req.body;

    await pgPool.query(
      `
        INSERT INTO notice_board.list (title, content, account_idx)                          
        VALUES ($1, $2, $3);
     `,
      [title, content, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

// 게시글 수정 api
router.put(
  "/:notice_idx",
  [Title, Post_content, validate],
  checkIsAdmin,
  wrapper(async (req, res, next) => {
    const { notice_idx } = req.params;
    const { accountIdx } = req.session;
    const { title, content } = req.body; // postWriterIdx를 프론트에서 받아오면 안된다

    if (!notice_idx) {
      req.code = 404;
      throw new Exception(404, "게시글 정보 없음");
    }

    await pgPool.query(
      `
        UPDATE notice_board.list SET title = $1, content = $2 
        WHERE idx = $3 AND account_idx = $4 RETURNING idx
    `,
      [title, content, notice_idx, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

// 게시글 삭제 api
router.delete(
  "/:notice_idx",
  checkIsAdmin,
  wrapper(async (req, res, next) => {
    const { notice_idx } = req.params;
    const { accountIdx } = req.session;

    if (!notice_idx) {
      req.code = 404;
      throw new Exception(404, "게시글 정보 없음");
    }

    await pgPool.query(
      `
        DELETE FROM notice_board.list 
        WHERE idx = $1 AND account_idx = $2 RETURNING idx`,
      [notice_idx, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);
module.exports = router;
