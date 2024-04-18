const router = require("express").Router();
const { Client } = require("pg");
const psqlClient = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkAuthorization");

router.post("/:free_idx", checkIsLogged, async (req, res) => {
  const { accountIdx } = req.session;
  const { free_idx } = req.params;

  const result = { success: false, message: "", data: null };
  const client = new Client(psqlClient);

  try {
    await client.connect();
    await client.query(`BEGIN`);
    await client.query(`SAVEPOINT like_savepoint;`);

    const sql = `SELECT * FROM free_board.like WHERE list_idx = $1 AND account_idx = $2;`;
    const values = [free_idx, accountIdx];
    const data = await client.query(sql, values);

    if (data.rows.length == 1) {
      client.end();
      result.message = "server: 이미 좋아요를 눌렀음";
      res.status(400).send(result);
    } else if (data.rows.length == 0) {
      const sql2 = `INSERT INTO free_board.like (list_idx, account_idx)
        VALUES ($1, $2) RETURNING idx;`;
      const values2 = [free_idx, accountIdx];
      const data2 = await client.query(sql2, values2);

      if (data2.rows.length == 0) {
        await client.query(`ROLLBACK TO like_savepoint`);
        await client.query(`COMMIT`);
        client.end();

        result.message = "server: 좋아요 데이터 삽입 실패";
        res.status(500).send(result);
      } else if (data2.rows.length == 1) {
        const sql3 = `UPDATE free_board.list
            SET like_count = like_count + 1 WHERE idx = $1 RETURNING idx;`;
        const values3 = [free_idx];
        const data3 = await client.query(sql3, values3);

        if (data3.rows.length == 0) {
          await client.query(`ROLLBACK TO like_savepoint`);
          await client.query(`COMMIT`);
          client.end();

          result.message = "server: 좋아요 데이터 삽입 성공 업데이트는 실패";
          res.status(500).send(result);
        } else if (data3.rows.length == 1) {
          result.message = "server:like success";
          result.success = true;
          res.status(200).send(result);
        }
      }
    }
  } catch (err) {
    await client.query(`ROLLBACK TO like_savepoint`);
    await client.query(`COMMIT`);
    client.end();

    res.status(err.status || 500).send({ message: err.message });
  }
});

router.delete("/:free_idx", checkIsLogged, async (req, res) => {
  const { accountIdx } = req.session;
  const { free_idx } = req.params;

  const result = { success: false, message: "", data: null };
  const client = new Client(psqlClient);

  try {
    await client.connect();
    await client.query(`BEGIN`);
    await client.query(`SAVEPOINT like_savepoint;`);

    const sql = `SELECT * FROM free_board.like WHERE list_idx = $1 AND account_idx = $2;`;
    const values = [free_idx, accountIdx];
    const data = await client.query(sql, values);

    if (data.rows.length == 0) {
      client.end();
      result.message = "server: 아직 좋아요를 누르지 않음";
      res.status(400).send(result);
    } else if (data.rows.length == 1) {
      const sql2 = `DELETE FROM free_board.like 
        WHERE list_idx = $1 AND account_idx = $2 RETURNING idx;`;
      const values2 = [free_idx, accountIdx];
      const data2 = await client.query(sql2, values2);

      if (data2.rows.length == 0) {
        await client.query(`ROLLBACK TO like_savepoint`);
        await client.query(`COMMIT`);
        client.end();

        result.message = "server: 좋아요 데이터 삭제 실패";
        res.status(500).send(result);
      } else if (data2.rows.length == 1) {
        const sql3 = `UPDATE free_board.list
            SET like_count = like_count - 1 WHERE idx = $1 RETURNING idx;`;
        const values3 = [free_idx];
        const data3 = await client.query(sql3, values3);

        if (data3.rows.length == 0) {
          await client.query(`ROLLBACK TO like_savepoint`);
          await client.query(`COMMIT`);
          client.end();
          result.message = "server: 좋아요 데이터 삭제 성공 업데이트 실패";
          res.status(500).send(result);
        } else if (data3.rows.length == 1) {
          const commitSql = `COMMIT;`;
          await client.query(commitSql);
          result.message = "server:좋아요 취소 성공";
          result.success = true;
          res.status(200).send(result);
        }
      }
    }
  } catch (err) {
    await client.query(`ROLLBACK TO like_savepoint`);
    await client.query(`COMMIT`);
    client.end();

    res.status(err.status || 500).send({ message: err.message });
  }
});

// 좋아요를 했는지 아닌지, 글과 댓글이 내가 작성한 글 또는 댓글인지 확인하는 api (isMine 컬럼)도 만들어주는게 좋다

module.exports = router;
