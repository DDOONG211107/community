const router = require("express").Router();
const { pgPool } = require("../database/postgreSQL");
const { checkIsLogin } = require("../middleware/checkIsLogin");
const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");
const result = require("../module/result");

router.post(
  "/:noticeIdx",
  checkIsLogin,
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { noticeIdx } = req.params;

    let client = null;

    try {
      client = await pgPool.connect();
      await client.query(`BEGIN`);

      // SELECT
      const likeStateResult = await client.query(
        `SELECT 
              * 
          FROM 
              notice_board.like 
          WHERE 
              list_idx = $1 
          AND 
              account_idx = $2`,
        [noticeIdx, accountIdx]
      );
      const like = likeStateResult.rows[0];

      if (like) {
        throw new Exception(409, "이미 좋아요를 누름");
      }

      // INSERT
      await client.query(
        `INSERT INTO notice_board.like 
              (list_idx, account_idx)
          VALUES 
              ($1, $2) 
          RETURNING idx`,
        [noticeIdx, accountIdx]
      );

      // UPDATE
      await client.query(
        `UPDATE 
              notice_board.list
          SET 
              like_count = like_count + 1 
          WHERE 
              idx = $1 
          RETURNING 
              idx`,
        [noticeIdx]
      );

      await client.query(`COMMIT`);

      req.code = 200;
      req.result = result();
      res.status(200).send(req.result);
    } catch (err) {
      await client.query(`ROLLBACK`);

      //   if (err.code == 23503) {
      //     throw new Exception(404, "서버: 존재하지 않는 글에 좋아요 누름");
      //   }

      throw err;
    } finally {
      client.release();
    }
  })
);

router.delete(
  "/:notice_idx",
  checkIsLogin,
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { notice_idx } = req.params;

    let client = null;

    try {
      client = await pgPool.connect();

      await client.query(`BEGIN`);

      const selectedResult = await client.query(
        `
        SELECT * 
        FROM notice_board.like 
        WHERE list_idx = $1 
        AND account_idx = $2;
      `,
        [notice_idx, accountIdx]
      );
      const like = selectedResult.rows[0];

      if (!like) {
        throw new Exception(409, "아직 좋아요 누르지 않음");
      }

      await client.query(
        `
        DELETE FROM notice_board.like 
        WHERE list_idx = $1 
        AND account_idx = $2 RETURNING idx;
      `,
        [notice_idx, accountIdx]
      );

      await client.query(
        `
        UPDATE notice_board.list
        SET like_count = like_count - 1 
        WHERE idx = $1 RETURNING idx;
      `,
        [notice_idx]
      );
      await client.query("COMMIT");

      req.code = 200;
      req.result = result();
      res.status(200).send(req.result);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

// 특정글에 내가 좋아요를 눌렀는지 안 눌렀는지 여부를 반환하는 api
router.get(
  "/:notice_idx",
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { notice_idx } = req.params;

    const selectedResult = pgPool.query(
      `
        SELECT * 
        FROM notice_board.like 
        WHERE account_idx = $1 AND list_idx = $2
        `,
      [accountIdx, notice_idx]
    );

    const like = selectedResult.rows[0];

    if (!like) {
      req.result = result(null, "좋아요 정보 없음");
    } else if (like) {
      req.result = result(null, "좋아요 정보 있음");
    }

    req.code = 200;
    res.status(200).send(req.result);
  })
);

module.exports = router;
