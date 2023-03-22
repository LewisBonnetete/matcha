import { Router } from "express";
import jwt from "jsonwebtoken";
import client from "../connection.js";
import { sendEmail } from "../utils/utils.js";

const router = Router();

async function updateUser(email, res) {
  const verifyValidEmailQuery = `Select * from "Users"
    where email = '${email}' and valid = TRUE`;

  const verifyEmailQuery = `Update "Users"
    set valid = TRUE
    where email = '${email}'`;

  try {
    const verifyEmailValid = await client.query(verifyValidEmailQuery);
    if (!verifyEmailValid.rows.length) {
      const verifyEmail = await client.query(verifyEmailQuery);
      res.status(200).json("Adresse email confirmée!");
    } else {
      res.status(400).json("Adresse email déjà validée");
    }
  } catch (error) {
    res.status(400).json({ err: error });
  }
}

async function updatePassword(data, res) {
  const changePasswordQuery = `update "Users" 
  set password = crypt($2, password)
  where email = $1`

  try {
    const changePassword = await client.query(changePasswordQuery, data);
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(400).json({ err: error });
  }
}

router.get("/confirm/:hash", async (req, res) => {
  const date = Math.round(Date.now() / 1000);
  jwt.verify(req.params.hash, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    else if (date > user.exp) return res.status(400).json("link expired");
    else {
      updateUser(user.email, res);
    }
  });
});

router.post("/forgotPassword", async (req, resp) => {
  try {
    let values = []
    values[0] = req.body.email

    const query = `select * from "Users"
    where email = $1 and valid = true`
    const checkIfExist = await client.query(query, values)
    if (checkIfExist.rows.length > 0) {
      const dataToCrypt = {};
      dataToCrypt.email = req.body.email;
      const hash = jwt.sign(dataToCrypt, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      let dataToSend = {}
      dataToSend.receiver = values[0]
      dataToSend.subject = "Réinitialisation de votre mot de passe Matcha"
      dataToSend.body = `Pour réinitialiser le mot de passe de votre compte Matcha.fr, veuillez suivre le lien suivant : http://localhost:8080/#/resetPassword/${hash}`
      sendEmail(dataToSend)
      resp.status(200).json({ status: 'Verification email sent' });
    }
    else
      resp.status(400).json({ err: 'Email doesnt exist' });
  } catch (err) {
    resp.status(400).json({ err: error });
  }
})

router.post("/changeForgottenPassword/:hash", async (req, res) => {

  const date = Math.round(Date.now() / 1000);

  try {
    jwt.verify(req.params.hash, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
      let values = []
      values[0] = user.email
      values[1] = req.body.password
      if (error) return res.sendStatus(403);
      else if (date > user.exp) return res.status(400).json("link expired");
      else {
        updatePassword(values, res)
      }
    })
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
})

router.post("/confirm/password", async (req, resp) => {
  try {
    let values = []
    values[0] = req.body.email
    values[1] = req.body.password

    const query = `update "Users"
     set password =crypt($2, gen_salt('bf'))
    where email = $1`
    const updatePassword = await client.query(query, values)
    resp.status(200).json({ status: 'Password updated' });
  } catch (err) {
    resp.status(400).json({ err: error });
  }
})
// function randomIntFromInterval(min, max) {
//   // min and max included
//   return Math.random() * (max - min) + min;
// }

// router.get("/import", async (req, res) => {
//   let id = 0;
//   try {
//     const updateUser = await client.query(`select * from "Users"`);
//     let latMin = 49.04660163560783;
//     let lonMin = 2.0973863382055358;
//     let latMax = 48.69998260023;
//     let lonMax = 2.6134058558201634;
//     let latitude = 0;
//     let longitude = 0;
//     let query = ""
//     for (let i = 0; i < updateUser.rows.length; i++) {
//       id = updateUser.rows[i].id;
//       latitude = randomIntFromInterval(latMin, latMax);
//       longitude = randomIntFromInterval(lonMin, lonMax);
//       query = `update "Users"
//       set latitude = ${latitude}, longitude = ${longitude}
//       where id = ${id}`
//       const updateUserLatitude = await client.query(query);
//     }
//     res.status(200).json({ status: "success" });
//   } catch (err) {
//     res.status(400).json({ err: err.message });
//   }
// });

export default router;
