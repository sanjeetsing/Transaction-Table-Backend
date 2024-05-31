const axios = require("axios");
const ProductTransaction = require("../models/ProductTransaction");

exports.initDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = response.data;

    await ProductTransaction.deleteMany({});
    await ProductTransaction.insertMany(data);

    res.status(200).json({ message: "Database initialized with seed data." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  const { search = "", page = 1, perPage = 10 } = req.query;
  const query = search
    ? {
        $or: [
          { title: new RegExp(search, "i") },
          { description: new RegExp(search, "i") },
          { price: parseFloat(search) },
        ],
      }
    : {};

  try {
    const transactions = await ProductTransaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStatistics = async (req, res) => {
  const { month } = req.query;

  try {
    const match = {
      $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
    };

    const totalSaleAmount = await ProductTransaction.aggregate([
      { $match: { ...match, sold: true } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    const totalSoldItems = await ProductTransaction.countDocuments({
      ...match,
      sold: true,
    });
    const totalNotSoldItems = await ProductTransaction.countDocuments({
      ...match,
      sold: false,
    });

    res.status(200).json({
      totalSaleAmount: totalSaleAmount[0] ? totalSaleAmount[0].total : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBarChart = async (req, res) => {
  const { month } = req.query;
  const ranges = [
    { label: "0-100", min: 0, max: 100 },
    { label: "101-200", min: 101, max: 200 },
    { label: "201-300", min: 201, max: 300 },
    { label: "301-400", min: 301, max: 400 },
    { label: "401-500", min: 401, max: 500 },
    { label: "501-600", min: 501, max: 600 },
    { label: "601-700", min: 601, max: 700 },
    { label: "701-800", min: 701, max: 800 },
    { label: "801-900", min: 801, max: 900 },
    { label: "901-above", min: 901, max: Infinity },
  ];

  try {
    const match = {
      $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
    };
    const barChartData = await Promise.all(
      ranges.map(async (range) => {
        const count = await ProductTransaction.countDocuments({
          ...match,
          price: { $gte: range.min, $lt: range.max },
        });
        return { range: range.label, count };
      })
    );

    res.status(200).json(barChartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPieChart = async (req, res) => {
  const { month } = req.query;

  try {
    const match = {
      $expr: { $eq: [{ $month: "$dateOfSale" }, parseInt(month)] },
    };
    const pieChartData = await ProductTransaction.aggregate([
      { $match: match },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ]);

    res.status(200).json(pieChartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCombinedData = async (req, res) => {
  const { month } = req.query;

  try {
    const [transactions, statistics, barChart, pieChart] = await Promise.all([
      exports.getTransactions(req, res),
      exports.getStatistics(req, res),
      exports.getBarChart(req, res),
      exports.getPieChart(req, res),
    ]);

    res.status(200).json({
      transactions: transactions.data,
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
