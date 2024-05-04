const router = require("express").Router();
const wrapper = require("../module/wrapper");
const { Exception } = require("../module/Exception");
const { pgPool } = require("../database/postgreSQL");
const { checkIsLogin } = require("../middleware/checkIsLogin");
const { Title, Post_content, validate } = require("../middleware/validate");
const result = require("../module/result");

// 게시글 목록 불러오기
router.get(
  "/",
  wrapper(async (req, res, next) => {
    const selectedResult = await pgPool.query(`
      SELECT 
          free_board.list.idx, free_board.list.title,
          account.list.nickname, free_board.list.like_count,
          free_board.list.created_at 
      FROM account.list
      JOIN free_board.list ON account.list.idx = free_board.list.account_idx
      ORDER BY idx;
      `);
    const posts = selectedResult.rows;

    req.code = 200;
    req.result = result({ posts: posts });
    res.status(200).send(req.result);
  })
);

// 게시글 불러오는 api
router.get(
  "/:free_idx",
  wrapper(async (req, res, next) => {
    const { accountIdx } = req.session;
    const { free_idx } = req.params;

    if (!free_idx) {
      req.code = 404;
      throw new Exception(404, "게시글 정보 없음");
    }

    const selectedResult = await pgPool.query(
      `
        SELECT free_board.list.*, account.list.nickname,
            CASE WHEN free_board.list.account_idx = $1 
            THEN true ELSE false END AS is_mine
        FROM account.list 
        JOIN free_board.list ON account.list.idx = free_board.list.account_idx
        WHERE free_board.list.idx = $2;
  `,
      [accountIdx, free_idx]
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
  checkIsLogin,
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { title, content } = req.body;

    await pgPool.query(
      `
        INSERT INTO free_board.list (title, content, account_idx)                          
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
  "/:free_idx",
  [Title, Post_content, validate],
  wrapper(async (req, res, next) => {
    const { free_idx } = req.params;
    const { accountIdx } = req.session;
    const { title, content } = req.body; // postWriterIdx를 프론트에서 받아오면 안된다

    if (!free_idx) {
      req.code = 404;
      throw new Exception(404, "게시글 정보 없음");
    }

    await pgPool.query(
      `
      UPDATE free_board.list SET title = $1, content = $2 
      WHERE idx = $3 AND account_idx = $4 RETURNING idx
    `,
      [title, content, free_idx, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

// 게시글 삭제 api
router.delete(
  "/:free_idx",
  wrapper(async (req, res, next) => {
    const { free_idx } = req.params;
    const { accountIdx } = req.session;

    if (!free_idx) {
      req.code = 404;
      throw new Exception(404, "게시글 정보 없음");
    }

    await pgPool.query(
      `
        DELETE FROM free_board.list 
        WHERE idx = $1 AND account_idx = $2 RETURNING idx`,
      [free_idx, accountIdx]
    );

    req.code = 200;
    req.result = result();
    res.status(200).send(req.result);
  })
);

module.exports = router;
