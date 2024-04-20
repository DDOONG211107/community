const router = require("express").Router();
const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkIsLogged");
const { Comment_content, validate } = require("../middleware/validate");

// 댓글 목록 불러오기 api
router.get("/", async (req, res, next) => {
  const { accountIdx } = req.session;
  const { free_idx } = req.body; // 불러와야 하는 자유게시판 글의 idx

  const result = {
    success: false,
    message: "",
    data: null,
  };
  let client = null;

  try {
    if (!free_idx) {
      throw { message: "게시글 idx 없음", status: 404 };
    }

    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `SELECT free_board.comment.*, account.list.nickname,
    CASE WHEN free_board.comment.account_idx = $1
    THEN true ELSE false END AS is_mine
    FROM free_board.comment JOIN account.list ON
    free_board.comment.account_idx = account.list.idx
    WHERE free_board.comment.list_idx = $2;`;
    const values = [accountIdx, free_idx];
    const data = await client.query(sql, values);
    client.release();

    result.data = data.rows;
    result.success = true;
    result.message = "get free comment success";

    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

router.post(
  "/",
  [Comment_content, validate],
  checkIsLogged,
  async (req, res, next) => {
    const { accountIdx } = req.session;
    const { content, free_idx } = req.body;

    const result = {
      success: false,
      message: "",
      data: null,
    };
    let client = null;

    try {
      if (!free_idx) {
        next({ message: "게시글 idx 없음", status: 400 });
        return;
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `INSERT INTO free_board.comment (content, list_idx, account_idx)
    VALUES ($1, $2, $3) RETURNING idx;`;
      const values = [content, free_idx, accountIdx];
      const data = await client.query(sql, values);
      await client.release();

      if (data.rows.length == 0) {
        next({ message: "server: insert comment failed", status: 500 });
      } else if (data.rows.length == 1) {
        result.message = "server: insert comment success";
        result.success = true;
        res.status(200).send(result);
      }
    } catch (err) {
      if (client) {
        client.release();
      }
      next(err);
    }
  }
);

router.put(
  "/:comment_idx",
  [Comment_content, validate],
  async (req, res, next) => {
    const { comment_idx } = req.params;
    const { accountIdx } = req.session;
    const { content } = req.body;

    const result = {
      success: false,
      message: "",
      data: null,
    };
    let client = null;

    try {
      if (!comment_idx) {
        next({ message: "댓글 idx 없음", status: 404 });
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `UPDATE free_board.comment SET content = $1 WHERE
    idx = $2 AND account_idx = $3 RETURNING content`;
      const values = [content, comment_idx, accountIdx];
      const data = await client.query(sql, values);
      await client.release();

      if (data.rows.length == 0) {
        next({ message: "server: edit comment failed", status: 500 });
      } else if (data.rows.length == 1) {
        result.message = "server: comment edit success";
        result.success = true;
        res.status(200).send(result);
      }
    } catch (err) {
      if (client) {
        client.release();
      }
      next(err);
    }
  }
);

router.delete("/:comment_idx", async (req, res, next) => {
  const { comment_idx } = req.params;
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  let client = null;

  try {
    if (!comment_idx) {
      next({ message: "댓글 idx 없음", status: 404 });
    }

    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `DELETE FROM free_board.comment WHERE idx = $1 AND account_idx = $2 returning idx;`;
    const values = [comment_idx, accountIdx];
    const data = await client.query(sql, values);
    await client.release();

    if (data.rows.length == 0) {
      next({ message: "server: delete comment failed", status: 500 });
    } else if (data.rows.length == 1) {
      result.message = "server: delete comment success";
      result.success = true;
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

module.exports = router;
