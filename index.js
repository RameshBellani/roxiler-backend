// src/index.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/product-transaction', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((error) => console.log(error));

app.use('/api', transactionRoutes);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
