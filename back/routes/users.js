import { Router } from "express";
import client from "../connection.js";
import {
  getExludeId,
  convertObjectToArray,
} from "../utils/utils.js";
import { getDistance } from "geolib";

const router = Router();

router.get("/:id/search/:distance", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  const getUserQuery = `SELECT U.*,
  COALESCE(
    (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
      FROM
        (SELECT B.BLOCKED_ID
          FROM "Users" U2
          JOIN "Blocks" B ON B.USER_ID = U2.ID
          WHERE U2.ID = U.ID) X),'[]') BLOCKS,
  COALESCE(
    (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
      FROM
        (SELECT R.REPORTED_ID
          FROM "Users" U2
          JOIN "Reports" R ON R.USER_ID = U2.ID
          WHERE U2.ID = U.ID) X),'[]') REPORTS
    from "Users" U
  where U.id = $1`;

  const getMatchesQuery = `SELECT U2.FIRST_NAME, U2.ID
  FROM "Likes" L
  JOIN "Likes" M ON L.USER_ID = M.LIKED_ID
  AND L.LIKED_ID = M.USER_ID
  JOIN "Users" U1 ON L.USER_ID = U1.ID
  JOIN "Users" U2 ON L.LIKED_ID = U2.ID
  WHERE L.USER_ID = $1`;

  const likedQuery = `select liked_id as id, u.first_name from "Likes" l
  join "Users" u on u.id = l.liked_id
  where l.user_id = $1`;

  try {
    let count = 0;
    let closeArray = [];
    const getUser = await client.query(getUserQuery, values);
    const getMatches = await client.query(getMatchesQuery, values);
    const user = getUser.rows[0];
    const getLikes = await client.query(likedQuery, values)

    let getAllUsersQuery = `SELECT U.ID, U.FIRST_NAME, U.AGE, U.GENDER, U.SEXUAL_ORIENTATION, U.BIO, U.LONGITUDE, U.LATITUDE, U.PICTURE_ID, U.ONLINE, U.LAST_SEEN, U.COMPLETE, U.score,
    COALESCE(
      (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
        FROM
          (SELECT B.LIKED_ID, B.LIKED_AT
            FROM "Users" U2
            JOIN "Likes" B ON B.USER_ID = U2.ID
            WHERE U2.ID = U.ID) X),'[]') LIKES,
    COALESCE(
      (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
        FROM
          (SELECT B.BLOCKED_ID
            FROM "Users" U2
            JOIN "Blocks" B ON B.USER_ID = U2.ID
            WHERE U2.ID = U.ID) X),'[]') BLOCKS,
    COALESCE(
      (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
        FROM
          (SELECT V.visited_id,V.VISIT_TIME
            FROM "Users" U2
            JOIN "Visits" V ON V.USER_ID = U2.ID
            WHERE U2.ID = U.ID) X),'[]') VISITS,
    COALESCE(
      (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
        FROM
          (SELECT R.REPORTED_ID
            FROM "Users" U2
            JOIN "Reports" R ON R.USER_ID = U2.ID
            WHERE U2.ID = U.ID) X),'[]') REPORTS,
    COALESCE(
      (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
        FROM
          (SELECT T.NAME
            FROM "Users" U2
            JOIN "UserTags" UT ON UT.USER_ID = U2.ID
            JOIN "Tags" T ON T.ID = UT.TAG_ID
            WHERE U2.ID = U.ID) X),'[]') TAGS,
    COALESCE(
      (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
        FROM
          (SELECT P.ENCRYPTED_PICTURE, P.CREATED_AT, P.ID
            FROM "Users" U2
            JOIN "Pictures" P ON P.USER_ID = U2.ID
            WHERE U2.ID = U.ID
            ORDER BY P.CREATED_AT) X),'[]') PICTURES
    FROM "Users" U
    left join "Likes" l on l.liked_id = u.id 
    left join "Dislikes" dl on dl.disliked_id = u.id 
    WHERE U.VALID = TRUE AND U.COMPLETE = TRUE AND U.ID != $1 and (l.user_id is null or l.user_id != $1) and (dl.user_id is null or dl.user_id != $1)
  `;
    let longitude = user.longitude;
    let latitude = user.latitude;

    let orientationString = ` and u.gender = `;
    if (user.sexual_orientation === 1) {
      if (user.gender === "Male") orientationString += `'Female'`;
      else if (user.gender === "Female") {
        orientationString += `'Male'`;
      }
      orientationString += `and u.sexual_orientation = 1`;
    } else if (user.sexual_orientation === 2) {
      orientationString += `'${user.gender}' and u.sexual_orientation = 2`;
    } else if (user.sexual_orientation === 3) {
      orientationString += `'Male' OR u.gender = 'Female'`;
    }

    getAllUsersQuery += orientationString;
    //ajouter le tri par score
    let toBeExcluded = getMatches.rows
    let exludeIdTab = getExludeId(user, toBeExcluded);

    for (let i = 0; i < exludeIdTab.length; i++) {
      getAllUsersQuery += `and U.ID != ${exludeIdTab[i]} `;
    }
    const getAllUsers = await client.query(getAllUsersQuery, values);
    for (let i = 0; i < getAllUsers.rows.length; i++) {
      let distance = getDistance(
        { latitude: latitude, longitude: longitude },
        {
          latitude: getAllUsers.rows[i].latitude,
          longitude: getAllUsers.rows[i].longitude,
        }
      );
      getAllUsers.rows[i].distance = distance;
      if (distance < req.params.distance) {
        count++;
        closeArray.push(getAllUsers.rows[i]);
      }
    }

    let newTab = []
    closeArray.forEach((el) => {
      if (el.bio.length > 0 && el.pictures.length > 0 && el.tags.length > 0)
        newTab.push(el)
    })

    newTab.sort((a, b) => (a.score < b.score ? 1 : -1));
    resp.status(200).json({ count: count, result: newTab });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.get("/:id", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;

  const getUserQuery = `
      SELECT U.ID, U.FIRST_NAME, U.AGE, U.GENDER, U.SEXUAL_ORIENTATION, U.BIO,U.PICTURE_ID, U.LAST_SEEN, U.ONLINE, u.score,
      COALESCE(
        (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
          FROM
            (SELECT B.LIKED_ID, B.LIKED_AT
              FROM "Users" U2
              JOIN "Likes" B ON B.USER_ID = U2.ID
              WHERE U2.ID = U.ID) X),'[]') LIKES,
      COALESCE(
        (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
          FROM
            (SELECT B.BLOCKED_ID
              FROM "Users" U2
              JOIN "Blocks" B ON B.USER_ID = U2.ID
              WHERE U2.ID = U.ID) X),'[]') BLOCKS,
      COALESCE(
        (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
          FROM
            (SELECT V.visited_id,V.VISIT_TIME
              FROM "Users" U2
              JOIN "Visits" V ON V.USER_ID = U2.ID
              WHERE U2.ID = U.ID) X),'[]') VISITS,
      COALESCE(
        (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
          FROM
            (SELECT R.REPORTED_ID
              FROM "Users" U2
              JOIN "Reports" R ON R.USER_ID = U2.ID
              WHERE U2.ID = U.ID) X),'[]') REPORTS,
      COALESCE(
        (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
          FROM
            (SELECT T.NAME
              FROM "Users" U2
              JOIN "UserTags" UT ON UT.USER_ID = U2.ID
              JOIN "Tags" T ON T.ID = UT.TAG_ID
              WHERE U2.ID = U.ID) X),'[]') TAGS,
      COALESCE(
        (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(X)))
          FROM
            (SELECT P.ENCRYPTED_PICTURE, P.CREATED_AT, P.ID
              FROM "Users" U2
              JOIN "Pictures" P ON P.USER_ID = U2.ID
              WHERE U2.ID = U.ID) X),'[]') PICTURES
    FROM "Users" U
    WHERE U.ID = $1 AND U.VALID = TRUE`;
  try {
    const result = await client.query(getUserQuery, values);
    let data = result.rows[0];
    // data.score = getScore(data.likes.length, data.visits.length);
    resp.status(200).json({ user: data });
  } catch (error) {
    resp.status(400).json({ err: error });
  }
});

router.get("/:id/matches", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  try {
    const matchesQuery = `select * from (SELECT U2.FIRST_NAME,
      U2.ID as user_id,
      L.LIKED_AT as time1,
      M.LIKED_AT as time2, 1 as type
    FROM "Likes" L
    JOIN "Likes" M ON L.USER_ID = M.LIKED_ID
    AND L.LIKED_ID = M.USER_ID
    JOIN "Users" U1 ON L.USER_ID = U1.ID
    JOIN "Users" U2 ON L.LIKED_ID = U2.ID
    WHERE L.USER_ID = $1) n
    left join "Blocks" b on b.blocked_id = n.user_id
    where b.blocked_id is null`;

    const visitQuery = `select user_id, u.first_name, visit_time as time, 2 as type from "Visits" v
    join "Users" u on u.id = v.user_id
    where visited_id = $1`;

    const likedQuery = `select  user_id, u.first_name, liked_at as time, 3 as type from "Likes" l
    join "Users" u on u.id = l.user_id
    where liked_id = $1`;

    const liked = await client.query(likedQuery, values);
    const visits = await client.query(visitQuery, values);
    const matches = await client.query(matchesQuery, values);
    matches.rows.forEach((match) => {
      if (match.time1 > match.time2) {
        match.time = match.time1;
      } else match.time = match.time2;
      delete match.time1;
      delete match.time2;
    });
    matches.rows.sort((a, b) => (a.time1 < b.time2 ? 1 : -1));
    let newTab = [];
    let count = 0;
    matches.rows.forEach((match) => {
      newTab[count] = match;
      count++;
    });
    visits.rows.forEach((visit) => {
      newTab[count] = visit;
      count++;
    });
    liked.rows.forEach((liked) => {
      newTab[count] = liked;
      count++;
    });

    newTab.sort((a, b) => (a.time < b.time ? 1 : -1));

    for (let i = newTab.length - 1; i > 0; i--) {
      if (i !== 0 && newTab[i].time.toString() === newTab[i - 1].time.toString()) {
        newTab.splice(i, 1);
      }
    }

    resp.status(200).json({ result: newTab });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.get("/:id/messages/:recipientId", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  values[1] = req.params.recipientId;

  const matchQuery = `SELECT *
                        FROM (
                          (SELECT U1.FIRST_NAME,
                              U1.ID,
                              M.MESSAGE,
                              M.READ,
                              M.MESSAGE_TIME
                            FROM "Messages" M
                            JOIN "Users" U1 ON U1.ID = M.USER_ID
                            WHERE USER_ID = $1 AND RECIPIENT_ID = $2)
                        UNION
                          (SELECT U2.FIRST_NAME,
                              U2.ID,
                              M.MESSAGE,
                              M.READ,
                              M.MESSAGE_TIME
                            FROM "Messages" M
                            JOIN "Users" U2 ON U2.ID = M.USER_ID
                            WHERE USER_ID = $2 AND RECIPIENT_ID = $1)) TMP
                        ORDER BY MESSAGE_TIME`;

  await client.query(matchQuery, values, (err, res) => {
    if (!err) {
      resp.status(200).json({ messages: res.rows });
    } else {
      resp.status(400).json({ err: err.message });
    }
  });
});

router.get("/:id/messages", async (req, resp) => {
  let data = [];
  let values = [];
  values[0] = req.params.id;
  const matchsQuery = `select * from (SELECT U2.FIRST_NAME, U2.ID, L.LIKED_AT
    FROM "Likes" L
    JOIN "Likes" M ON L.USER_ID = M.LIKED_ID
    AND L.LIKED_ID = M.USER_ID
    JOIN "Users" U1 ON L.USER_ID = U1.ID
    JOIN "Users" U2 ON L.LIKED_ID = U2.ID
    WHERE L.USER_ID = $1) n
left join "Blocks" b on b.blocked_id = n.id
left join "Blocks" b2 on b2.user_id = n.id
where b.blocked_id is null and b2.blocked_id is null
`;

  try {
    const res = await client.query(matchsQuery, values);
    if (res.rows.length !== 0) {
      for (let i = 0; i < res.rows.length; i++) {
        let checkIfEmpty = await client.query(
          `select * from "Messages"
        where (user_id = $1 and recipient_id =  ${res.rows[i].id}) or (user_id =  ${res.rows[i].id} and recipient_id = $1)`,
          values
        );
        if (checkIfEmpty.rows.length === 0) {
          let temp = res.rows[i];
          temp.message_time = res.rows[i].liked_at;
          temp.message = "";
          temp.recipient_id = temp.id;
          temp.user_id = parseInt(req.params.id);
          delete temp.id;
          delete temp.liked_at;
          data.push(res.rows[i]);
        } else {
          let resp = await client.query(
            `
            select u.first_name, m.* 
            from "Messages" m 
            join 
            (select max(id) der_msg_id
            from 
            (select * 
            from "Messages" m 
            where user_id = $1 and recipient_id = ${res.rows[i].id}
            union 
            select * 
            from "Messages" m 
            where user_id = ${res.rows[i].id} and recipient_id = $1) msg_entre_users) dernier_message on m.id = der_msg_id
            join "Users" u on u.id = m.user_id`,
            values
          );
          data.push(resp.rows[0]);
        }
      }
      //sort messages by users
      let temp = [];
      for (let i = 0; i < data.length; i++) {
        if (
          i !== 0 &&
          data[i - 1].message_time.getTime() < data[i].message_time.getTime()
        ) {
          temp[i - 1] = data[i - 1];
          data[i - 1] = data[i];
          data[i] = temp[i - 1];
          i = 0;
        }
      }
      resp.status(200).json({ messages: data });
    } else {
      resp.status(200).json({ messages: [] });
    }
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.get("/:id/notifications", async (req, resp) => {
  let datas = [];
  let values = [];
  values[0] = req.params.id;

  const notificationsQuery = `
  select n.*, u.first_name from "Notifications" n
  join "Users" u on u.id = n.peer_id
    left join "Blocks" b on b.blocked_id = u.id
      where n.user_id = $1 and blocked_id is null
  order by id
`;

  await client.query(notificationsQuery, values, (err, res) => {
    if (!err) {
      datas = res.rows;
      // for (let i = 0; i < datas.length; i++) {
      //   if (datas[i].type === 1) datas[i].type = "message";
      //   if (datas[i].type === 2) datas[i].type = "like";
      //   if (datas[i].type === 3) datas[i].type = "visit";
      //   if (datas[i].type === 4) datas[i].type = "match";
      //   if (datas[i].type === 5) datas[i].type = "dislike";
      // }
      resp.status(200).json({ notifications: datas });
    } else {
      resp.status(400).json({ err: err.message });
    }
  });
});

router.get("/tags/list", async (req, resp) => {
  try {
    const getTags = await client.query(`select * from "Tags"`);
    resp.status(200).json({ tags: getTags.rows });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.post("/:id/visit/:visitedId", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  values[1] = req.params.visitedId;

  const checkIfExistQuery = `select * from "Visits"
  where user_id = $1 and visited_id = $2 and visit_time::date = current_date`;

  const postVisitQuery = `insert into "Visits" (user_id, visited_id, visit_time)
  values ($1, $2, current_timestamp)
  returning id`;

  const updateScoreQuery = `update "Users"
  set score = score - 5
  where id = $1 and score > 0`

  try {
    const checkIfExist = await client.query(checkIfExistQuery, values);
    if (checkIfExist.rows.length === 0) {
      const postVisit = await client.query(postVisitQuery, values);
      const updateScore = await client.query(updateScoreQuery, [parseInt(req.params.visitedId)])
      let data = {};
      data.user_id = values[1];
      data.peer_id = values[0]
      data.type = 3;
      postNotification(data);
      resp.status(200).json({ status: "success" });
    } else
      resp.status(200).json({
        err: "already visited today, not inserting new line in db",
      });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.post("/:id/like/:likedId", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  values[1] = req.params.likedId;

  const checkIfExistQuery = `select * from "Likes"
  where user_id = $1 and liked_id = $2`;

  const checkIFLikedAlreadyQuery = `select * from "Likes"
  where liked_id = $1 and user_id = $2`

  const postLikeQuery = `insert into "Likes" (user_id, liked_id, liked_at)
  values ($1, $2,CURRENT_TIMESTAMP)
  returning id`;

  const deleteDislikeQuery = `delete from "Dislikes"
  where user_id = $1 and disliked_id = $2`

  const updateScoreQuery = `update "Users"
  set score = score + 10
  where id = $1 and score < 100`

  let isMatch = 0
  try {
    const checkIfExist = await client.query(checkIfExistQuery, values);
    if (checkIfExist.rows.length === 0) {
      const checkIFLikedAlready = await client.query(checkIFLikedAlreadyQuery, values)
      if (checkIFLikedAlready.rows.length > 0)
        isMatch = 1
      const postLike = await client.query(postLikeQuery, values);
      const deleteDislike = await client.query(deleteDislikeQuery, values)
      const updateScore = await client.query(updateScoreQuery, [parseInt(req.params.likedId)]);
      let data = {};
      data.user_id = values[1];
      data.peer_id = values[0];
      isMatch ? data.type = 4 : data.type = 2;
      postNotification(data);
      resp.status(200).json({ status: "success" });
    } else
      resp.status(200).json({
        err: "already liked, not inserting new line in db",
      });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.post("/:id/dislike/:dislikedId", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  values[1] = req.params.dislikedId;

  const checkIfExistQuery = `select * from "Dislikes"
  where user_id = $1 and disliked_id = $2`;

  const postDislikeQuery = `insert into "Dislikes" (user_id, disliked_id, disliked_at)
  values ($1, $2,CURRENT_TIMESTAMP)
  returning id`;

  const deleteLikeQuery = `delete from "Likes"
  where user_id = $1 and liked_id = $2`

  const checkIfMatchQuery = `select * from (SELECT U2.FIRST_NAME,
    U2.ID as user_id,
    L.LIKED_AT as time1,
    M.LIKED_AT as time2, 1 as type
  FROM "Likes" L
  JOIN "Likes" M ON L.USER_ID = M.LIKED_ID
  AND L.LIKED_ID = M.USER_ID
  JOIN "Users" U1 ON L.USER_ID = U1.ID
  JOIN "Users" U2 ON L.LIKED_ID = U2.ID
  WHERE L.USER_ID = $1) n
  left join "Blocks" b on b.blocked_id = n.user_id
  where b.blocked_id is null and n.user_id = $2`

  try {
    const checkIfExist = await client.query(checkIfExistQuery, values);
    if (checkIfExist.rows.length === 0) {
      const checkIfMatch = await client.query(checkIfMatchQuery, values)
      const deleteLikes = await client.query(deleteLikeQuery, values);
      const postDislike = await client.query(postDislikeQuery, values);
      if (checkIfMatch.rows.length > 0) {
        let data = {};
        data.user_id = values[1];
        data.peer_id = values[0]
        data.type = 5;
        postNotification(data);
      }
      resp.status(200).json({ status: "success" });
    } else
      resp.status(200).json({
        err: "already disliked, not inserting new line in db",
      });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.post("/:id/block/:blockedId", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  values[1] = req.params.blockedId;

  const checkIfExistQuery = `select * from "Blocks"
  where user_id = $1 and blocked_id = $2`;

  const postBlockQuery = `insert into "Blocks" (user_id, blocked_id)
  values ($1, $2)`;

  try {
    const checkIfExist = await client.query(checkIfExistQuery, values);
    if (checkIfExist.rows.length === 0) {
      const postBlock = await client.query(postBlockQuery, values);
      resp.status(200).json({ status: "success" });
    } else
      resp.status(200).json({
        err: "already blocked, not inserting new line in db",
      });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.post("/:id/report/:reportedId", async (req, resp) => {
  const data = req.body;
  let values = [];
  values[0] = req.params.id;
  values[1] = req.params.reportedId;
  // values[2] = data.text;
  // values[3] = data.reason;

  const checkIfExistQuery = `select * from "Reports"
  where user_id = $1 and reported_id = $2`;

  const postBlockQuery = `insert into "Reports" (user_id, reported_id)
  values ($1, $2)`;

  const updateScoreQuery = `update "Users"
  set score = score - 15
  where id = $1 and score > 0`

  try {
    const checkIfExist = await client.query(checkIfExistQuery, values);
    if (checkIfExist.rows.length === 0) {
      const postBlock = await client.query(postBlockQuery, values);
      const updateScore = await client.query(updateScoreQuery, [req.params.reportedId])
      resp.status(200).json({ status: "success" });
    } else
      resp.status(200).json({
        err: "already reported, not inserting new line in db",
      });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.post("/:id/messages/:recipientId", async (req, resp) => {
  let values = [];
  values[0] = req.params.id;
  values[1] = req.params.recipientId;
  values[2] = req.body.message;
  const postMessageQuery = `insert into "Messages" (user_id, recipient_id, message, read, message_time)
  values ($1, $2, $3, false, CURRENT_TIMESTAMP)
  returning id`;

  try {
    const postMessage = await client.query(postMessageQuery, values);
    let data = {};
    data.user_id = values[1];
    data.type = 1;
    postNotification(data);
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.post("/:id/picture", async (req, resp) => {
  try {
    let values = [];
    values[0] = parseInt(req.params.id);
    values[1] = req.body.picture;
    const query = `insert into "Pictures" (user_id, encrypted_picture, created_at)
                    values ($1, $2, CURRENT_TIMESTAMP)`;
    const postPicture = await client.query(query, values);
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.post("/:id/tag", async (req, resp) => {
  try {
    let values = [];
    values[0] = parseInt(req.params.id);
    values[1] = parseInt(req.body.tag_id);
    const query = `insert into "UserTags" (user_id, tag_id)
                    values ($1, $2)`;
    const postPicture = await client.query(query, values);
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.put("/:id", async (req, resp) => {
  const data = req.body;

  if (Object.keys(data).length > 0) {
    const res = convertObjectToArray(data);
    let tagCount = 1;
    let tags = []
    let updateParameters = []
    updateParameters.push(parseInt(req.params.id))
    let updateUserQuery = `update "Users"
      set `;
    let deleteTagsQuery = `delete from "UserTags" where user_id = $1;`
    let updateTagsQuery = `insert into "UserTags" (user_id, tag_id)
    values `
    let count = 2;
    for (let i = 0; i < res.data.length; i++) {
      if (res.key[i] !== "password" && res.key[i] !== "tags" && res.data[i] !== '') {
        updateParameters.push(res.data[i])
        updateUserQuery += `${res.key[i]} = $${count} ,`;
        count++;
      }
      else if (res.key[i] === "tags") {
        tags = res.data[i]
        tags.forEach((el, index) => {
          updateTagsQuery += `($1, $${tagCount + 1})`
          tagCount++
          if (index < tags.length - 1)
            updateTagsQuery += ' ,'
        })
      }
    }
    updateUserQuery = updateUserQuery.slice(0, -1)
    updateUserQuery += `where id = $1`;
    tags.unshift(parseInt(req.params.id))
    try {
      const updateUser = await client.query(updateUserQuery, updateParameters);
      if (tagCount > 1) {
        const deleteTags = await client.query(deleteTagsQuery, [req.params.id]);
        const updateTags = await client.query(updateTagsQuery, tags);
      }
      resp.status(200).json({ status: "success" });
    } catch (err) {
      resp.status(400).json({ err: err.message });
    }
  } else resp.status(400).json({ err: "body is empty" });
});

router.put("/:id/complete", async (req, resp) => {
  try {
    let values = [];
    values[0] = req.params.id;

    const completeRequest = await client.query(
      `update "Users" 
    set complete = true
    where id = $1`,
      values
    );
    resp.status(200).json({ status: "success" });
  } catch (error) {
    resp.status(400).json({ err: error });
  }
});

router.put("/:id/picture", async (req, resp) => {
  try {
    let values = [];
    values[0] = parseInt(req.body.picture_id);
    values[1] = parseInt(req.params.id);
    const updatePicture = await client.query(
      `update "Users"
                                              set picture_id = $1
                                              where user = $2`,
      values
    );
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.put("/:id/notifications", async (req, resp) => {
  try {
    let values = [];
    values[0] = parseInt(req.params.id);

    const updateNotification = await client.query(
      `update "Notifications"
    set read = true
    where user_id = $1`,
      values
    );
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.put("/:id/online/:status", async (req, resp) => {
  try {
    let values = [];
    values[0] = req.params.id;
    values[1] = req.params.status;
    const query = `update "Users"
    set online = $2, last_seen = current_timestamp
    where id = $1`;
    const logoutRequest = await client.query(query, values);
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

router.put("/:id/password", async (req, resp) => {
  try {
    let values1 = [];
    let values2 = []
    values1[0] = parseInt(req.params.id);
    values1[1] = req.body.oldPassword;
    values2[0] = parseInt(req.params.id)
    values2[1] = req.body.newPassword;

    const ifExistQuery = `select * from "Users"
    WHERE ID = $1
    AND password = crypt($2, password)
    AND VALID = TRUE`;
    const updatePasswordQuery = `update "Users"
    set password = crypt($2, gen_salt('bf'))
    where id = $1`;
    const ifExist = await client.query(ifExistQuery, values1);
    if (ifExist.rows.length > 0) {
      const updatePassword = await client.query(updatePasswordQuery, values2);
      resp.status(200).json({ status: "Password updated" });
    } else resp.status(400).json({ error: "Wrong password specified" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.post("/delPicture", async (req, resp) => {
  try {
    let values = [];
    values[0] = req.body.picture_id;
    const query = `delete from "Pictures"
                  where id = $1`;
    const postPicture = await client.query(query, values);
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.delete("/:id/tag", async (req, resp) => {
  try {
    let values = [];
    values[0] = parseInt(req.params.id);
    values[1] = parseInt(req.body.tag_id);
    const query = `delete from "UserTags"
                  where user_id = $1 and user_id = $2`;
    const postPicture = await client.query(query, values);
    resp.status(200).json({ status: "success" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

async function postNotification(data) {
  let values = [];
  values[0] = data.user_id;
  values[1] = data.type;
  values[2] = data.peer_id
  try {
    const query = `insert into "Notifications" (user_id, type, read, peer_id, time)
    values ($1, $2, false, $3, current_timestamp)`;
    const postNotifications = await client.query(query, values);
    return `Notification updated`;
  } catch (error) {
    return `Error updating notification`;
  }
}

export default router;
