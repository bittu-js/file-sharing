const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/filesharing_db';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Check your MONGODB_URI in Render environment variables and ensure MongoDB Atlas Network Access allows 0.0.0.0/0.');
  }
};

module.exports = connectDB;
