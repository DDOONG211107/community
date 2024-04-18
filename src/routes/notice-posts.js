const router = require("express").Router();
const { checkIsAdmin } = require("../middleware/checkAuthorization");
const { Client } = require("pg");
const psqlClient = require("../database/postgreSQL");
const { Title, Post_content, validate } = require("../middleware/validate");

// 게시글 목록 불러오기
router.get("/", async (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient);

  try {
    await client.connect();
    const sql = `SELECT notice_board.list.idx, notice_board.list.title,
    account.list.nickname, notice_board.list.like_count,
    notice_board.list.created_at FROM account.list
    JOIN notice_board.list ON account.list.idx = notice_board.list.account_idx
    ORDER BY idx;`;
    const data = await client.query(sql);
    await client.end();

    result.data = data.rows;
    result.success = true;
    result.message = "get notice lists success";

    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(500).send({ message: err.message });
  }
});

router.get("/:notice_idx", async (req, res) => {
  const { notice_idx } = req.params; // 이거 이름 noticeIdx로 고치기.

  const result = {
    success: false,
    message: "",
    data: null,
  };

  const client = new Client(psqlClient);

  try {
    if (!notice_idx) {
      throw { message: "게시글 idx 없음", status: 400 }; // 이거는 400으로 고치자..
    }

    await client.connect();
    const sql = `SELECT notice_board.list.*, account.list.nickname
    FROM account.list JOIN notice_board.list
    ON account.list.idx = notice_board.list.account_idx
    WHERE notice_board.list.idx = $1;`;
    const values = [notice_idx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "서버: 존재하지 않는 게시글";
      res.status(400).send(result);
    } else if (data.rows.length == 1) {
      result.data = {
        idx: data.rows[0].idx,
        created_at: data.rows[0].created_at,
        title: data.rows[0].title,
        content: data.rows[0].content,
        account_idx: data.rows[0].account_idx,
        like_count: data.rows[0].like_count,
        nickname: data.rows[0].nickname,
      };
      result.success = true;
      result.message = "get notice-item success";
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
});

// 게시글 작성 api
router.post(
  "/",
  [Title, Post_content, validate],
  checkIsAdmin,
  async (req, res) => {
    const { accountIdx } = req.session;
    const { title, content } = req.body;

    const result = {
      success: false,
      message: "",
      data: null,
    };

    const client = new Client(psqlClient);

    try {
      await client.connect();
      const sql = `INSERT INTO notice_board.list (title, content, account_idx)                          
       VALUES ($1, $2, $3);`;
      const values = [title, content, accountIdx];
      await client.query(sql, values);
      client.end();

      result.message = "서버: 공지글 작성 성공";
      result.success = true;
      res.status(200).send(result);
    } catch (err) {
      if (client) {
        client.end();
      }
      res.status(err.status || 500).send({ message: err.message });
    }
  }
);

// 게시글 수정 api
router.put(
  "/:notice_idx",
  [Title, Post_content, validate],
  checkIsAdmin,
  async (req, res) => {
    const { notice_idx } = req.params;
    const { accountIdx } = req.session;
    const { title, content } = req.body; // postWriterIdx를 프론트에서 받아오면 안된다

    const result = {
      success: false,
      message: "",
      data: null,
    };

    const client = new Client(psqlClient);

    try {
      if (!notice_idx) {
        throw { message: "존재하지 않는 게시글", status: 404 };
      }

      await client.connect();
      const sql = `UPDATE notice_board.list SET title = $1, content = $2 
        WHERE idx = $3 AND account_idx = $4 RETURNING idx`;
      const values = [title, content, notice_idx, accountIdx];
      const data = await client.query(sql, values);
      await client.end();

      if (data.rows.length == 0) {
        result.message = "server: edit notice post failed";
        res.status(500).send(result);
      } else if (data.rows.length == 1) {
        result.message = "server: edit notice post success";
        result.success = true;
        res.status(200).send(result);
      }
    } catch (err) {
      if (client) {
        client.end();
      }
      res.status(err.status || 500).send({ message: err.message });
    }
  }
);

// 게시글 삭제 api
router.delete("/:notice_idx", checkIsAdmin, async (req, res) => {
  const { notice_idx } = req.params;
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  const client = new Client(psqlClient);

  try {
    if (!notice_idx) {
      throw { message: "존재하지 않는 게시글", status: 404 };
    }

    await client.connect();
    const sql =
      "DELETE FROM notice_board.list WHERE idx = $1 AND account_idx = $2 RETURNING idx";
    const values = [notice_idx, accountIdx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "server: delete notice post failed";
      res.status(500).send(result);
    } else if (data.rows.length == 1) {
      result.message = "server: delete notice post success";
      result.success = true;
      res.status(200).send(result);
    }
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
});
module.exports = router;
