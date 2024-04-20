const router = require("express").Router();
const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");
const { checkIsAdmin } = require("../middleware/checkIsAdmin");
const { Title, Post_content, validate } = require("../middleware/validate");

// 게시글 목록 불러오기
router.get("/", async (req, res, next) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `
    SELECT 
        notice_board.list.idx, notice_board.list.title,
        account.list.nickname, notice_board.list.like_count,
        notice_board.list.created_at 
    FROM account.list
    JOIN notice_board.list ON account.list.idx = notice_board.list.account_idx
    ORDER BY idx;
    `;
    const data = await client.query(sql);
    client.release();

    result.data = data.rows;
    result.success = true;
    result.message = "get notice lists success";

    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

router.get("/:notice_idx", async (req, res, next) => {
  const { accountIdx } = req.session;
  const { notice_idx } = req.params;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    if (!notice_idx) {
      next({ status: 400, message: "게시글 정보 존재하지 않음" }); // 이거는 400으로 고치자..
      return;
    }

    const sql = `SELECT notice_board.list.*, account.list.nickname,
    CASE WHEN notice_board.list.account_idx = $1 
    THEN true ELSE false END AS is_mine
    FROM account.list JOIN notice_board.list
    ON account.list.idx = notice_board.list.account_idx
    WHERE notice_board.list.idx = $2;`;
    const values = [accountIdx, notice_idx];
    const data = await client.query(sql, values);
    client.release();

    if (data.rows.length == 0) {
      next({ status: 404, message: "존재하지 않는 게시글" });
    } else if (data.rows.length == 1) {
      result.data = data.rows;
      result.success = true;
      result.message = "get notice-item success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    next(err);
  }
});

// 게시글 작성 api
router.post(
  "/",
  [Title, Post_content, validate],
  checkIsAdmin,
  async (req, res, next) => {
    const { accountIdx } = req.session;
    const { title, content } = req.body;

    const result = {
      success: false,
      message: "",
      data: null,
    };

    let client = null;

    try {
      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `INSERT INTO notice_board.list (title, content, account_idx)                          
       VALUES ($1, $2, $3);`;
      const values = [title, content, accountIdx];
      await client.query(sql, values);
      client.release();

      result.message = "서버: 공지글 작성 성공";
      result.success = true;
      res.status(200).send(result);
    } catch (err) {
      if (client) {
        client.release();
      }
      next(err);
    }
  }
);

// 게시글 수정 api
router.put(
  "/:notice_idx",
  [Title, Post_content, validate],
  checkIsAdmin,
  async (req, res, next) => {
    const { notice_idx } = req.params;
    const { accountIdx } = req.session;
    const { title, content } = req.body; // postWriterIdx를 프론트에서 받아오면 안된다

    const result = {
      success: false,
      message: "",
      data: null,
    };

    let client = null;

    try {
      if (!notice_idx) {
        next({ message: "존재하지 않는 게시글", status: 404 });
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `UPDATE notice_board.list SET title = $1, content = $2 
        WHERE idx = $3 AND account_idx = $4 RETURNING idx`;
      const values = [title, content, notice_idx, accountIdx];
      const data = await client.query(sql, values);
      client.release();

      if (data.rows.length == 0) {
        next({ status: 500, message: "server: edit notice post failed" });
      } else if (data.rows.length == 1) {
        result.message = "server: edit notice post success";
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

// 게시글 삭제 api
router.delete("/:notice_idx", checkIsAdmin, async (req, res, next) => {
  const { notice_idx } = req.params;
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  let client = null;

  try {
    if (!notice_idx) {
      next({ message: "존재하지 않는 게시글", status: 404 });
    }

    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql =
      "DELETE FROM notice_board.list WHERE idx = $1 AND account_idx = $2 RETURNING idx";
    const values = [notice_idx, accountIdx];
    const data = await client.query(sql, values);
    client.release();

    if (data.rows.length == 0) {
      next({ status: 500, message: "server: delete notice post failed" });
    } else if (data.rows.length == 1) {
      result.message = "server: delete notice post success";
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
