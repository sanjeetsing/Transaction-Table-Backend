const express = require("express");
const router = express.Router();
const {
  initDatabase,
  getTransactions,
  getStatistics,
  getBarChart,
  getPieChart,
  getCombinedData,
} = require("../controllers/transactionsController");

router.get("/initdb", initDatabase);
router.get("/", getTransactions);
router.get("/statistics", getStatistics);
router.get("/bar_chart", getBarChart);
router.get("/pie_chart", getPieChart);
router.get("/combined_data", getCombinedData);

module.exports = router;
