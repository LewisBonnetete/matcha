// const Client = require("pg").Client;
import pg from "pg";
import dotenv from "dotenv";
const Client = pg.Client;

dotenv.config();

let client;
// if (process.env.NODE_ENV === "production") {
//   client = new Client({
//     connectionString: process.env.CONSTR,
//     ssl: {
//       rejectUnauthorized: false,
//     },
//   });
// } else {
client = new Client({
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});
client.connect();
// }

export default client;
