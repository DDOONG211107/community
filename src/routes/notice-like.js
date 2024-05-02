const router = require("express").Router();
const { Pool } = require("pg");
const { psqlPoolClient, pgPool } = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkIsLogged");
const { Exception } = require("../module/Exception");
const wrapper = require("../module/wrapper");

router.post(
  "/:noticeIdx",
  checkIsLogged,
  wrapper(async (req, res) => {
    const { accountIdx } = req.session;
    const { noticeIdx } = req.params;

    const client = await pgPool.connect();
    try {
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

      res.status(200).send(result(null, "server:like success"));
    } catch (err) {
      await client.query(`ROLLBACK`);

      if (err.code == 23503) {
        throw new Exception(404, "서버: 존재하지 않는 글에 좋아요 누름");
      }

      throw err;
    } finally {
      client.release();
    }
  })
);

router.delete("/:notice_idx", checkIsLogged, async (req, res, next) => {
  const { accountIdx } = req.session;
  const { notice_idx } = req.params;

  const result = { success: false, message: "", data: null };
  req.result = result;
  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    await client.query(`BEGIN`);
    await client.query(`SAVEPOINT like_savepoint;`);

    const sql = `
        SELECT * FROM notice_board.like 
        WHERE list_idx = $1 AND account_idx = $2;
        `;
    const values = [notice_idx, accountIdx];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      throw new Exception(409, "아직 좋아요 누르지 않음");
    } else if (data.rows.length == 1) {
      const sql2 = `
        DELETE FROM notice_board.like 
        WHERE list_idx = $1 AND account_idx = $2 RETURNING idx;
        `;
      const values2 = [notice_idx, accountIdx];
      const data2 = await client.query(sql2, values2);

      // 좋아요 데이터 삭제 실패
      if (data2.rows.length == 0) {
        await client.query(`ROLLBACK TO like_savepoint`);

        result.message = "좋아요 삭제 실패 -> 롤백 완료";
        next({ code: 500 });

        // 좋아요 데이터 삭제 성공
      } else if (data2.rows.length == 1) {
        const sql3 = `
            UPDATE notice_board.list
            SET like_count = like_count - 1 WHERE idx = $1 RETURNING idx;
        `;
        const values3 = [notice_idx];
        const data3 = await client.query(sql3, values3);

        // 좋아요 데이터 삭제는 성공했으나 업데이트 실패
        if (data3.rows.length == 0) {
          await client.query(`ROLLBACK TO like_savepoint`);
          result.message =
            "좋아요 삭제는 성공했으나 라이크 테이블 업데이트 실패";
          next({ code: 500 });

          // 모두 성공. 커밋
        } else if (data3.rows.length == 1) {
          result.message = "server:좋아요 취소 success";
          result.success = true;
          req.code = 200;
          res.status(req.code).send(result);
        }
      }
    }
  } catch (err) {
    console.log(err);
    if (client) {
      await client.query(`ROLLBACK TO like_savepoint`);
    }
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next(err);
  } finally {
    await client.query(`COMMIT`);
    client.release();
  }
});

// 특정글에 내가 좋아요를 눌렀는지 안 눌렀는지 여부를 반환하는 api
router.get("/:notice_idx", async (req, res, next) => {
  const { accountIdx } = req.session;
  const { notice_idx } = req.params;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  req.result = result;

  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `
        SELECT * 
        FROM notice_board.like 
        WHERE account_idx = $1 AND list_idx = $2
        `;
    const values = [accountIdx, notice_idx];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      result.message = "좋아요 정보 없음";
    } else if (data.rows.length == 1) {
      result.message = "좋아요 정보 있음";
    }
    result.success = true;
    req.code = 200;
    res.status(req.code).send(result);
  } catch (err) {
    result.message = err.message ? err.message : "알 수 없는 서버 에러";
    next(err);
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
