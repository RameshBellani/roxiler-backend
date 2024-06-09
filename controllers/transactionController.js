// src/controllers/transactionController.js
const axios = require('axios');
const Transaction = require('../models/Transaction');

// Initialize database with seed data
exports.initializeDatabase = async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.deleteMany({});
        const transactions = response.data.map((transaction) => {
            // Ensure price is a number, convert non-numeric values to 0
            const price = parseFloat(transaction.price);
            return {
                ...transaction,
                price: isNaN(price) ? 0 : price,
            };
        });
        await Transaction.insertMany(transactions);
        res.status(200).json({ message: 'Database initialized with seed data' });
    } catch (error) {
        console.error('Error initializing database:', error.message);
        res.status(500).json({ message: 'Error initializing database' });
    }
};

// List all transactions with search and pagination
exports.getTransactions = async (req, res) => {
    try {
        let { month, page = 1, perPage = 10, search = '' } = req.query;
        
        // Validate month parameter
        if (!month || isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
            throw new Error('Invalid month parameter');
        }

        month = month.padStart(2, '0'); // Ensure month is in two-digit format

        console.log(`Fetching transactions for month: ${month}, page: ${page}, perPage: ${perPage}, search: ${search}`);

        const startDate = new Date(`2021-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const query = {
            dateOfSale: { $gte: startDate, $lt: endDate },
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ],
        };

        if (!isNaN(search)) {
            query.$or.push({ price: Number(search) });
        }

        console.log('Query:', query);

        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(perPage);

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            transactions,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        });
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

// Get statistics for the selected month
exports.getStatistics = async (req, res) => {
    try {
        let { month } = req.query;
        
        // Validate month parameter
        if (!month || isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
            throw new Error('Invalid month parameter');
        }

        month = month.padStart(2, '0'); // Ensure month is in two-digit format

        console.log(`Fetching statistics for month: ${month}`);

        const startDate = new Date(`2021-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const transactions = await Transaction.find({
            dateOfSale: { $gte: startDate, $lt: endDate },
        });

        const totalSaleAmount = transactions.reduce((acc, t) => acc + t.price, 0);
        const totalSoldItems = transactions.filter((t) => t.sold).length;
        const totalNotSoldItems = transactions.filter((t) => !t.sold).length;

        res.status(200).json({
            totalSaleAmount,
            totalSoldItems,
            totalNotSoldItems,
        });
    } catch (error) {
        console.error('Error fetching statistics:', error.message);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
};

// Get data for bar chart
exports.getBarChartData = async (req, res) => {
    try {
        let { month } = req.query;
        
        // Validate month parameter
        if (!month || isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
            throw new Error('Invalid month parameter');
        }

        month = month.padStart(2, '0'); // Ensure month is in two-digit format

        console.log(`Fetching bar chart data for month: ${month}`);

        const startDate = new Date(`2021-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const transactions = await Transaction.find({
            dateOfSale: { $gte: startDate, $lt: endDate },
        });

        const priceRanges = {
            '0-100': 0,
            '101-200': 0,
            '201-300': 0,
            '301-400': 0,
            '401-500': 0,
            '501-600': 0,
            '601-700': 0,
            '701-800': 0,
            '801-900': 0,
            '901-above': 0,
        };

        transactions.forEach((transaction) => {
            if (transaction.price <= 100) priceRanges['0-100']++;
            else if (transaction.price <= 200) priceRanges['101-200']++;
            else if (transaction.price <= 300) priceRanges['201-300']++;
            else if (transaction.price <= 400) priceRanges['301-400']++;
            else if (transaction.price <= 500) priceRanges['401-500']++;
            else if (transaction.price <= 600) priceRanges['501-600']++;
            else if (transaction.price <= 700) priceRanges['601-700']++;
            else if (transaction.price <= 800) priceRanges['701-800']++;
            else if (transaction.price <= 900) priceRanges['801-900']++;
            else priceRanges['901-above']++;
        });

        res.status(200).json(priceRanges);
    } catch (error) {
        console.error('Error fetching bar chart data:', error.message);
        res.status(500).json({ message: 'Error fetching bar chart data' });
    }
};

// Get data for pie chart
exports.getPieChartData = async (req, res) => {
    try {
        let { month } = req.query;
        
        // Validate month parameter
        if (!month || isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
            throw new Error('Invalid month parameter');
        }

        month = month.padStart(2, '0'); // Ensure month is in two-digit format

        console.log(`Fetching pie chart data for month: ${month}`);

        const startDate = new Date(`2021-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const transactions = await Transaction.find({
            dateOfSale: { $gte: startDate, $lt: endDate },
        });

        const categories = {};

        transactions.forEach((transaction) => {
            if (!categories[transaction.category]) {
                categories[transaction.category] = 0;
            }
            categories[transaction.category]++;
        });

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching pie chart data:', error.message);
        res.status(500).json({ message: 'Error fetching pie chart data' });
    }
};

// Get combined data from all APIs
exports.getCombinedData = async (req, res) => {
    try {
        let { month, search = '', page = 1, perPage = 10 } = req.query;
        
        // Validate month parameter
        if (!month || isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
            throw new Error('Invalid month parameter');
        }

        month = month.padStart(2, '0'); // Ensure month is in two-digit format

        console.log(`Fetching combined data for month: ${month}, search: ${search}, page: ${page}, perPage: ${perPage}`);

        const transactionsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/transactions`, { params: { month, search, page, perPage } });
        const statisticsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/statistics`, { params: { month } });
        const barChartResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/bar-chart`, { params: {month} });
        const pieChartResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/pie-chart`, { params: { month } });

            const combinedData = {
                transactions: transactionsResponse.data,
                statistics: statisticsResponse.data,
                barChart: barChartResponse.data,
                pieChart: pieChartResponse.data,
            };
    
            res.status(200).json(combinedData);
        } catch (error) {
            console.error('Error fetching combined data:', error.message);
            res.status(500).json({ message: 'Error fetching combined data' });
        }
    };
    