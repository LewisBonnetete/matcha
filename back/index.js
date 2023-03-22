import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";

//routes
import users from "./routes/users.js";
import auth from "./routes/auth.js";
import mail from "./routes/mail.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});


// app.use("/users", authenticateToken, users);
app.use("/users", users);
app.use("/auth", auth);
app.use("/mail", mail);

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token === null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ err: err.message });
    req.user = user;
    next();
  });
}

app.listen(process.env.PORT || 3000, () =>
  console.log(`Example app listening on port ` + process.env.PORT || 3000)
);
