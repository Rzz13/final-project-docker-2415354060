const express = require("express");
const app = express();

require("dotenv").config();

app.use(express.json());

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log("Attempting to connect to MySQL database...", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? "****" : "(not set)",
  database: process.env.DB_NAME,
});

const initDatabase = () => {
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL database:", err);
      setTimeout(initDatabase, 5000);
      return;
    }
    console.log("Connected to MySQL database");

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        )
      `;
    connection.query(createTableQuery, (err, results) => {
      if (err) {
        console.error("Error creating table:", err);
        return;
      }
      console.log("Table created or already exists");
    });
  });
};

initDatabase();

app.get("/", (req, res) => {
  const selectQuery = "SELECT * FROM users";
  connection.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
      return;
    }
    res.json(results);
  });
});

app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  const selectQuery = "SELECT * FROM users WHERE id = ?";
  connection.query(selectQuery, [id], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Failed to fetch user" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(results[0]);
  });
});

app.post("/users", (req, res) => {
  const { name } = req.body;
  const insertQuery = "INSERT INTO users (name) VALUES (?)";
  connection.query(insertQuery, [name], (err, results) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: "Failed to create user" });
      return;
    }
    res.status(201).json({ id: results.insertId, name });
  });
});

app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const updateQuery = "UPDATE users SET name = ? WHERE id = ?";
  connection.query(updateQuery, [name, id], (err) => {
    if (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: "Failed to update user" });
      return;
    }
    res.json({ id, name });
  });
});

app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  const deleteQuery = "DELETE FROM users WHERE id = ?";
  connection.query(deleteQuery, [id], (err) => {
    if (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Failed to delete user" });
      return;
    }
    res.status(204).send();
  });
});

app.listen(process.env.APP_PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${process.env.APP_PORT}`);
});
