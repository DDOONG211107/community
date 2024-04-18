const router = require("express").Router();
const { Client } = require("pg");
const psqlClient = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkAuthorization");
const { Comment_content, validate } = require("../middleware/validate");

// 댓글 목록 불러오기 api
router.get("/", async (req, res) => {
  const { notice_idx } = req.body; // 불러와야 하는 공지글의 idx

  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient);

  try {
    if (!notice_idx) {
      throw { message: "게시글 idx 없음", status: 400 };
    }

    await client.connect();
    const sql = `SELECT notice_board.comment.*, account.list.nickname
    FROM notice_board.comment JOIN account.list ON
    notice_board.comment.account_idx = account.list.idx
    WHERE notice_board.comment.list_idx = $1;`;
    const values = [notice_idx];
    const data = await client.query(sql, values);
    client.end();

    result.data = data.rows;
    result.success = true;
    result.message = "get notice comment success";

    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(err.status || 500).send({ message: err.message });
  }
});

router.post(
  "/",
  [Comment_content, validate],
  checkIsLogged,
  async (req, res) => {
    const { accountIdx } = req.session;
    const { content, notice_idx } = req.body;

    const result = {
      success: false,
      message: "",
      data: null,
    };

    const client = new Client(psqlClient);

    try {
      if (!notice_idx) {
        throw { message: "게시글 idx 없음", status: 400 };
      }

      await client.connect();
      const sql = `INSERT INTO notice_board.comment (content, list_idx, account_idx)
      VALUES ($1, $2, $3) RETURNING idx;`;
      const values = [content, notice_idx, accountIdx];
      const data = await client.query(sql, values);
      await client.end();

      if (data.rows.length == 0) {
        result.message = "server: insert comment failed";
        res.status(500).send(result);
      } else if (data.rows.length == 1) {
        result.message = "server: insert comment success";
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

router.put("/:comment_idx", [Comment_content, validate], async (req, res) => {
  const { comment_idx } = req.params;
  const { accountIdx } = req.session;
  const { content } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient);
  try {
    if (!comment_idx) {
      throw { message: "댓글 idx 없음", status: 404 };
    }

    await client.connect();
    const sql = `UPDATE notice_board.comment SET content = $1 WHERE
    idx = $2 AND account_idx = $3 RETURNING idx`;
    const values = [content, comment_idx, accountIdx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "server: edit comment failed";
      res.status(500).send(result);
    } else if (data.rows.length == 1) {
      result.message = "server: edit comment success";
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

router.delete("/:comment_idx", async (req, res) => {
  const { comment_idx } = req.params;
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };

  const client = new Client(psqlClient);

  try {
    if (!comment_idx) {
      throw { message: "댓글 idx 없음", status: 404 };
    }

    await client.connect();
    const sql = `DELETE FROM notice_board.comment WHERE idx = $1 AND account_idx = $2 RETURNING idx;`;
    const values = [comment_idx, accountIdx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "server: delete comment failed";
      res.status(500).send(result);
    } else if (data.rows.length == 1) {
      result.message = "server: delete comment success";
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
