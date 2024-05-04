const router = require("express").Router();
const { pgPool } = require("../database/postgreSQL");
const { checkIsLogin } = require("../middleware/checkIsLogin");
const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");
const result = require("../module/result");

router.post(
  "/:freeIdx",
  checkIsLogin,
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { freeIdx } = req.params;

    let client = null;

    try {
      client = await pgPool.connect();
      await client.query(`BEGIN`);

      // SELECT
      const likeStateResult = await client.query(
        `SELECT 
              * 
          FROM 
              free_board.like 
          WHERE 
              list_idx = $1 
          AND 
              account_idx = $2`,
        [freeIdx, accountIdx]
      );
      const like = likeStateResult.rows[0];

      if (like) {
        throw new Exception(409, "이미 좋아요를 누름");
      }

      // INSERT
      await client.query(
        `INSERT INTO free_board.like 
              (list_idx, account_idx)
          VALUES 
              ($1, $2) 
          RETURNING idx`,
        [freeIdx, accountIdx]
      );

      // UPDATE
      await client.query(
        `UPDATE 
              free_board.list
          SET 
              like_count = like_count + 1 
          WHERE 
              idx = $1 
          RETURNING 
              idx`,
        [freeIdx]
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
  "/:free_idx",
  checkIsLogin,
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { free_idx } = req.params;

    let client = null;

    try {
      client = await pgPool.connect();

      await client.query(`BEGIN`);

      const selectedResult = await client.query(
        `
        SELECT * 
        FROM free_board.like 
        WHERE list_idx = $1 
        AND account_idx = $2;
      `,
        [free_idx, accountIdx]
      );
      const like = selectedResult.rows[0];

      if (!like) {
        throw new Exception(409, "아직 좋아요 누르지 않음");
      }

      await client.query(
        `
        DELETE FROM free_board.like 
        WHERE list_idx = $1 
        AND account_idx = $2 RETURNING idx;
      `,
        [free_idx, accountIdx]
      );

      await client.query(
        `
        UPDATE free_board.list
        SET like_count = like_count - 1 
        WHERE idx = $1 RETURNING idx;
      `,
        [free_idx]
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
  "/:free_idx",
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { free_idx } = req.params;

    const selectedResult = pgPool.query(
      `
        SELECT * 
        FROM free_board.like 
        WHERE account_idx = $1 AND list_idx = $2
        `,
      [accountIdx, free_idx]
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
