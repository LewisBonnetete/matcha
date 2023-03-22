import { Router } from "express";
import client from "../connection.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/utils.js";
import validator from "email-validator"

const router = Router();

router.post("/", async (req, resp) => {
  let data = {};
  let values = []
  values[0] = req.body.email
  values[1] = req.body.password

  const user = { email: req.body.email };
  const authQuery = `select * from "Users"
  WHERE EMAIL = $1
  AND password = crypt($2, password)
  AND VALID = TRUE
  `;
  try {
    const results = await client.query(authQuery, values);
    if (results.rows.length > 0) {
      user.id = results.rows[0].id
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "4h",
      });
      data.accessToken = accessToken;
      data.user = results.rows;
      if (!data.user[0].valid) {
        const dataToCrypt = {};
        dataToCrypt.email = email;
        const hash = jwt.sign(dataToCrypt, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1d",
        });
        const dataToSend = {};
        dataToSend.receiver = email;
        dataToSend.body = `Pour confirmer la création de votre compte Matcha.fr, veuillez cliquer sur ce lien : http://localhost:${process.env.PORT || 3000}/mail/confirm/${hash}`;
        dataToSend.subject = "Confirmez la création de votre compte Matcha ❤️"
        sendEmail(dataToSend);
        resp.json({ message: "User still need mail verification" })
      }
      resp.json({ data: data });
    } else resp.status(400).json({ error: "unauthorized" });
  } catch (err) {
    resp.status(400).json({ error: err });
  }
});

router.post("/users", async (req, resp) => {
  const data = req.body;

  let values = []
  values[0] = data.password
  values[1] = data.email
  values[2] = data.first_name
  values[3] = data.last_name
  values[4] = parseInt(data.age)
  values[5] = data.gender
  values[6] = parseInt(data.sexual_orientation)
  values[7] = data.longitude
  values[8] = data.latitude
  values[9] = data.bio

  const checkIfExistQuery = `select * from "Users"
  where email = $1`;
  const postUserQuery = `
  insert into "Users" (password, email, first_name, last_name, age, gender, sexual_orientation, longitude, latitude, created_at, valid, complete, bio, score)
  values (crypt($1, gen_salt('bf')), $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, false, false, $10, 50)
  `;

  const dataToCrypt = {};
  dataToCrypt.email = data.email;
  const hash = jwt.sign(dataToCrypt, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });

  const dataToSend = {};
  dataToSend.receiver = data.email;
  dataToSend.body = `http://localhost:${process.env.PORT || 3000}/mail/confirm/${hash}`;
  try {
    if (validator.validate(data.email) === true) {
      const checkIfExist = await client.query(checkIfExistQuery, [data.email]);
      if (checkIfExist.rows.length === 0) {
        const postUser = await client.query(postUserQuery, values);
        sendEmail(dataToSend);
        resp.status(200).json({ status: "success" });
      } else resp.status(400).json({ err: "email already exist" });
    } else resp.status(400).json({ err: "email is not correct" });
  } catch (err) {
    resp.status(400).json({ err: err.message });
  }
});

export default router;
