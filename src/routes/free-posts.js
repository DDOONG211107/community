const router = require("express").Router();
const { Client } = require("pg");
const psqlClient = require("../database/postgreSQL");
const { checkIsLogged } = require("../middleware/checkAuthorization");
const { Title, Post_content, validate } = require("../middleware/validate");

// 게시글 목록 불러오기
router.get("/", async (req, res) => {
  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient); // 에러가 나기 쉬운 코드이므로 let으로 바꾸고 무조건 try 안에서 꼭 new Client()해주기

  try {
    await client.connect();
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
    await client.end();

    result.data = data.rows;
    result.success = true;
    result.message = "get free lists success";

    res.status(200).send(result);
  } catch (err) {
    if (client) {
      client.end();
    }
    res.status(500).send({ message: err.message });
  }
});

// 게시글 불러오는 api
router.get("/:free_idx", async (req, res) => {
  const { free_idx } = req.params;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient);

  try {
    if (!free_idx) {
      throw { message: "게시글 idx 없음", status: 400 };
    }

    await client.connect();
    const sql = `SELECT free_board.list.*, account.list.nickname
    FROM account.list JOIN free_board.list
    ON account.list.idx = free_board.list.account_idx
    WHERE free_board.list.idx = $1;`;
    const values = [free_idx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "서버: 존재하지 않는 게시글";
      res.status(400).send(result); // 404가 맞다 (204를 쓸 수도 있다)
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
      result.message = "get free-item success";
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
  checkIsLogged,
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
      const sql = `INSERT INTO free_board.list (title, content, account_idx)                          
     VALUES ($1, $2, $3);`;
      const values = [title, content, accountIdx];
      await client.query(sql, values);
      client.end();

      result.message = "서버: 자유게시판글 작성 성공";
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
router.put("/:free_idx", [Title, Post_content, validate], async (req, res) => {
  const { free_idx } = req.params;
  const { accountIdx } = req.session;
  const { title, content } = req.body;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient);

  try {
    if (!free_idx) {
      throw { message: "존재하지 않는 게시글", status: 404 };
    }

    await client.connect();
    const sql = `UPDATE free_board.list SET title = $1, content = $2 
      WHERE idx = $3 AND account_idx = $4 RETURNING idx`;
    const values = [title, content, free_idx, accountIdx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "server: edit free post failed";
      res.status(500).send(result); // 이것도 500보다 더 적합한 코드가 있다 (500은 api가 아예 돌아가지 않았다는 뜻, 이 if문은 통신은 성공했다는 뜻이므로 약간 다르다)(404를 쓸수도 있다)
    } else if (data.rows.length == 1) {
      result.message = "server: edit free post success";
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

// 게시글 삭제 api
router.delete("/:free_idx", async (req, res) => {
  const { free_idx } = req.params;
  const { accountIdx } = req.session;

  const result = {
    success: false,
    message: "",
    data: null,
  };
  const client = new Client(psqlClient);

  try {
    if (!free_idx) {
      throw { message: "존재하지 않는 게시글", status: 404 };
    }

    await client.connect();
    const sql =
      "DELETE FROM free_board.list WHERE idx = $1 AND account_idx = $2 RETURNING idx";
    const values = [free_idx, accountIdx];
    const data = await client.query(sql, values);
    await client.end();

    if (data.rows.length == 0) {
      result.message = "server: delete free post failed";
      res.status(500).send(result);
    } else if (data.rows.length == 1) {
      result.message = "server: delete free post success";
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
