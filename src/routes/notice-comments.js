const router = require("express").Router();
const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkIsLogged");
const { Comment_content, validate } = require("../middleware/validate");

// 댓글 목록 불러오기 api
router.get("/", async (req, res, next) => {
  const { accountIdx } = req.session;
  const { notice_idx } = req.body; // 불러와야 하는 공지글의 idx

  const result = {
    success: false,
    message: "",
    data: null,
  };

  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "notice_comments/",
    rest: "get",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: result,
    code: 500,
  };

  let client = null;

  try {
    if (!notice_idx) {
      result.message = "게시글정보 없음";
      log.code = 404;
      res.log = log;

      res.status(log.code).send(result);
    }

    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `
        SELECT notice_board.comment.*, account.list.nickname,
            CASE WHEN notice_board.comment.account_idx = $1 
            THEN true ELSE false END AS is_mine
        FROM notice_board.comment 
        JOIN account.list ON notice_board.comment.account_idx = account.list.idx
        WHERE notice_board.comment.list_idx = $2;
    `;
    const values = [accountIdx, notice_idx];
    const data = await client.query(sql, values);

    result.data = data.rows;
    result.success = true;
    result.message = "get notice comment success";

    log.code = 200;
    res.log = log;

    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "notice-comments/",
      rest: "get",
      code: err.code,
      message: err.message,
      result: result,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.post(
  "/",
  [Comment_content, validate],
  checkIsLogged,
  async (req, res, next) => {
    const { accountIdx } = req.session;
    const { content, notice_idx } = req.body;

    const result = {
      success: false,
      message: "",
      data: null,
    };

    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      name: "notice_comments/",
      rest: "post",
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 500,
    };

    let client = null;

    try {
      if (!notice_idx) {
        result.message = "게시글정보 없음";
        log.code = 404;
        res.log = log;

        return res.status(404).send(result);
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `
        INSERT INTO notice_board.comment (content, list_idx, account_idx)
        VALUES ($1, $2, $3) RETURNING idx;
      `;
      const values = [content, notice_idx, accountIdx];
      const data = await client.query(sql, values);

      if (data.rows.length == 0) {
        result.message = "server: insert comment failed";
        log.code = 500;
      } else if (data.rows.length == 1) {
        result.message = "server: insert comment success";
        result.success = true;
        log.code = 200;
      }
      res.log = log;
      res.status(log.code).send(result);
    } catch (err) {
      if (err.code == 23503) {
        result.message = "존재하지 않는 게시글에 댓글 작성 시도";
        log.code = 400;
        res.log = log;

        res.status(log.code).send(result);
      } else {
        result.message = err.message ? err.message : "알 수 없는 서버 에러";
        next({
          name: "notice-comments/",
          rest: "post",
          code: err.code,
          message: err.message,
          result: result,
        });
      }
    } finally {
      if (client) {
        client.release();
      }
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

    const log = {
      accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
      name: "notice_comments/:comment_idx",
      rest: "put",
      createdAt: new Date(),
      reqParams: req.params,
      reqBody: req.body,
      result: result,
      code: 500,
    };
    let client = null;
    try {
      if (!comment_idx) {
        result.message = "댓글 idx 없음";
        log.code = 404;
        res.log = log;

        return res.status(404).send(result);
      }

      const pool = await new Pool(psqlPoolClient);
      client = await pool.connect();

      const sql = `
        UPDATE notice_board.comment SET content = $1 
        WHERE idx = $2 AND account_idx = $3 RETURNING idx
      `;
      const values = [content, comment_idx, accountIdx];
      const data = await client.query(sql, values);

      if (data.rows.length == 0) {
        result.message = "server: edit comment failed";
        log.code = 500;
      } else if (data.rows.length == 1) {
        result.message = "server: edit comment success";
        result.success = true;
        log.code = 200;
      }

      res.log = log;
      res.status(log.code).send(result);
    } catch (err) {
      result.message = err.message ? err.message : "알 수 없는 서버 에러";
      next({
        name: "notice_comments/:comment_idx",
        rest: "put",
        code: err.code,
        message: err.message,
        result: result,
      });
    } finally {
      if (client) {
        client.release();
      }
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

  const log = {
    accountIdx: req.session.accountIdx ? req.session.accountIdx : 0,
    name: "notice_comments/:comment_idx",
    rest: "delete",
    createdAt: new Date(),
    reqParams: req.params,
    reqBody: req.body,
    result: {},
    code: 500,
  };
  let client = null;

  try {
    if (!comment_idx) {
      result.message = "댓글 idx 없음";
      log.code = 404;
      res.log = log;

      return res.status(404).send(result);
    }

    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `
        DELETE FROM notice_board.comment 
        WHERE idx = $1 AND account_idx = $2 RETURNING idx;
    `;
    const values = [comment_idx, accountIdx];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.message = "server: delete comment failed";
      log.status = 500;
    } else if (data.rows.length == 1) {
      result.message = "server: delete comment success";
      result.success = true;
      log.status = 200;
    }

    res.log = log;
    res.status(log.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next({
      name: "notice_comments/:comment_idx",
      rest: "put",
      code: err.code,
      message: err.message,
      result: result,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
