import mysql from "mysql2";
import dotenv from "dotenv";
export default function dbRequest (dbHost){
// MySQL connection

dotenv.config();


const db = mysql.createConnection({
  host: dbHost,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: 3306
  });
  
  // Connect to MySQL
  db.connect((err) => {
    if (err) {
      console.error("Database connection failed: ", err);
      return;
    }
    // console.log("Connected to MySQL database");
  });
  return db;
}
