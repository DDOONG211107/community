const router = require("express").Router();
const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkIsLogged");
const { Title, Post_content, validate } = require("../middleware/validate");

// 게시글 목록 불러오기
router.get("/", async (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    // sql은 이런식으로 구분해주기 (조건마다 엔터 끊어주기)
    const sql = ` 
        SELECT 
            free_board.list.idx, free_board.list.title, account.list.nickname, 
            free_board.list.like_count, free_board.list.created_at
        FROM account.list
        JOIN free_board.list ON account.list.idx = free_board.list.account_idx
        ORDER BY idx;
    `;
    const data = await client.query(sql);
    client.release();

    result.data = data.rows;
    result.success = true;
    result.message = "get free lists success";

    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

// 게시글 불러오는 api
router.get("/:free_idx", async (req, res, next) => {
  const { accountIdx } = req.session;
  const { free_idx } = req.params;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  let client = null;

  try {
    if (!free_idx) {
      next({ message: "게시글 idx 없음", status: 404 });
      return;
    }

    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `
    SELECT free_board.list.*, account.list.nickname,
    CASE
        WHEN free_board.list.account_idx = $1
        THEN true ELSE false END AS is_mine
    FROM account.list 
    JOIN free_board.list ON account.list.idx = free_board.list.account_idx
    WHERE free_board.list.idx = $2;
    `;
    const values = [accountIdx, free_idx];
    const data = await client.query(sql, values);
    await client.release();

    if (data.rows.length == 0) {
      next({ status: 404, message: "서버: 존재하지 않는 게시글" }); // 404가 맞다 (204를 쓸 수도 있다)
    } else if (data.rows.length == 1) {
      result.data = data.rows[0];
      result.success = true;
      result.message = "get free-item success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.release();
    }
    next(err);
  }
});

// 게시글 작성 api
router.post(
  "/",
  [Title, Post_content, validate],
  checkIsLogged,
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

      const sql = `INSERT INTO free_board.list (title, content, account_idx)                          
     VALUES ($1, $2, $3);`;
      const values = [title, content, accountIdx];
      await client.query(sql, values);
      client.release();

      result.message = "서버: 자유게시판글 작성 성공";
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
  "/:free_idx",
  [Title, Post_content, validate],
  async (req, res, next) => {
    const { free_idx } = req.params;
    const { accountIdx } = req.session;
    const { title, content } = req.body;

    const result = {
      success: false,
      message: "",
      data: null,
    };
    let client = null;

    try {
      if (!free_idx) {
        next({ message: "존재하지 않는 게시글", status: 404 });
        return;
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `UPDATE free_board.list SET title = $1, content = $2 
      WHERE idx = $3 AND account_idx = $4 RETURNING idx`;
      const values = [title, content, free_idx, accountIdx];
      const data = await client.query(sql, values);
      await client.release();

      if (data.rows.length == 0) {
        next({ message: "server: edit free post failed", status: 404 });
        // 이것도 500보다 더 적합한 코드가 있다 (500은 api가 아예 돌아가지 않았다는 뜻, 이 if문은 통신은 성공했다는 뜻이므로 약간 다르다)(404를 쓸수도 있다)
      } else if (data.rows.length == 1) {
        result.message = "server: edit free post success";
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
router.delete("/:free_idx", async (req, res, next) => {
  const { free_idx } = req.params;
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  let client = null;

  try {
    if (!free_idx) {
      next({ message: "존재하지 않는 게시글", status: 404 });
    }

    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql =
      "DELETE FROM free_board.list WHERE idx = $1 AND account_idx = $2 RETURNING idx";
    const values = [free_idx, accountIdx];
    const data = await client.query(sql, values);
    await client.release();

    if (data.rows.length == 0) {
      next({ message: "server:delete free post failed", status: 404 });
    } else if (data.rows.length == 1) {
      result.message = "server: delete free post success";
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
