const router = require("express").Router();
const { Pool } = require("pg");
const { psqlPoolClient } = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkIsLogged");

router.post("/:free_idx", checkIsLogged, async (req, res, next) => {
  const { accountIdx } = req.session;
  const { free_idx } = req.params;

  const result = { success: false, message: "", data: null };
  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();
    await client.query(`BEGIN`);
    await client.query(`SAVEPOINT like_savepoint;`);

    const sql = `SELECT * FROM free_board.like WHERE list_idx = $1 AND account_idx = $2;`;
    const values = [free_idx, accountIdx];
    const data = await client.query(sql, values);

    if (data.rows.length == 1) {
      client.release();
      next({ status: 400, message: "서버: 이미 좋아요를 눌렀음" });
    } else if (data.rows.length == 0) {
      const sql2 = `INSERT INTO free_board.like (list_idx, account_idx)
        VALUES ($1, $2) RETURNING idx;`;
      const values2 = [free_idx, accountIdx];
      const data2 = await client.query(sql2, values2);

      if (data2.rows.length == 0) {
        await client.query(`ROLLBACK TO like_savepoint`);
        await client.query(`COMMIT`);
        client.release();
        next({ status: 500, message: "좋아요 삽입 실패 -> 롤백 완료" });
      } else if (data2.rows.length == 1) {
        const sql3 = `UPDATE free_board.list
            SET like_count = like_count + 1 WHERE idx = $1 RETURNING idx;`;
        const values3 = [free_idx];
        const data3 = await client.query(sql3, values3);

        if (data3.rows.length == 0) {
          await client.query(`ROLLBACK TO like_savepoint`);
          await client.query(`COMMIT`);
          client.release();
          next({
            status: 500,
            message:
              "server: 좋아요 삽입은 성공했으나 업데이트 실패 -> 롤백 완료",
          });
        } else if (data3.rows.length == 1) {
          await client.query(`COMMIT`);
          await client.release();
          result.message = "server:like success";
          result.success = true;
          res.status(200).send(result);
        }
      }
    }
  } catch (err) {
    if (client) {
      await client.query(`ROLLBACK TO like_savepoint`);
      await client.query(`COMMIT`);
      client.release();
    }
    if (err.code == "23503") {
      next({ message: "서버: 존재하지 않는 글에 좋아요 누름", status: 400 });
    } else {
      next(err);
    }
  }
});

router.delete("/:free_idx", checkIsLogged, async (req, res, next) => {
  const { accountIdx } = req.session;
  const { free_idx } = req.params;

  const result = { success: false, message: "", data: null };
  let client = null;

  try {
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    await client.query(`BEGIN`);
    await client.query(`SAVEPOINT like_savepoint;`);

    const sql = `SELECT * FROM free_board.like WHERE list_idx = $1 AND account_idx = $2;`;
    const values = [free_idx, accountIdx];
    const data = await client.query(sql, values);

    if (data.rows.length === 0) {
      client.release(true);
      next({ message: "아직 좋아요 누르지 않음", status: 400 });
    } else if (data.rows.length == 1) {
      const sql2 = `DELETE FROM free_board.like 
        WHERE list_idx = $1 AND account_idx = $2 RETURNING idx;`;
      const values2 = [free_idx, accountIdx];
      const data2 = await client.query(sql2, values2);

      if (data2.rows.length == 0) {
        await client.query(`ROLLBACK TO like_savepoint`);
        await client.query(`COMMIT`);
        client.release();
        next({ message: "좋아요 취소 실패", status: 500 });
      } else if (data2.rows.length == 1) {
        const sql3 = `UPDATE free_board.list
            SET like_count = like_count - 1 WHERE idx = $1 RETURNING idx;`;
        const values3 = [free_idx];
        const data3 = await client.query(sql3, values3);

        if (data3.rows.length == 0) {
          await client.query(`ROLLBACK TO like_savepoint`);
          await client.query(`COMMIT`);
          client.release();
          next({ message: "좋아요 삭제 성공, 업데이트 실패", status: 500 });
        } else if (data3.rows.length == 1) {
          await client.query(`COMMIT`);
          await client.release();
          result.message = "server:좋아요 취소 성공";
          result.success = true;
          res.status(200).send(result);
        }
      }
    } else {
      console.log("7");
    }
  } catch (err) {
    if (client) {
      await client.query(`ROLLBACK TO like_savepoint`);
      await client.query(`COMMIT`);
      await client.release();
    }
    next(err);
  }
});

// 좋아요를 했는지 아닌지, 글과 댓글이 내가 작성한 글 또는 댓글인지 확인하는 api (isMine 컬럼)도 만들어주는게 좋다
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
    const pool = await new Pool(psqlPoolClient);
    client = await pool.connect();

    const sql = `
          SELECT * 
          FROM free_board.like 
          WHERE account_idx = $1 AND list_idx = $2
          `;
    const values = [accountIdx, free_idx];
    const data = await client.query(sql, values);
    client.release();

    if (data.rows.length == 0) {
      result.success = true;
      result.message = "좋아요 정보 없음";
      res.status(200).send(result);
    } else if (data.rows.length == 1) {
      result.success = true;
      result.message = "좋아요 정보 있음";
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
