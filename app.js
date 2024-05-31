const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const transactions = require("./routes/transactions");

const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/transactions", transactions);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
