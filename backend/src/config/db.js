const mongoose = require('mongoose');
const { config } = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log('[db] MongoDB connected');
}

module.exports = { connectDB };
