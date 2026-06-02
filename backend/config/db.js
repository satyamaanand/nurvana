const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nurvana', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    console.error('\n==================================================================');
    console.error('TIP: Please ensure MongoDB is running locally, or set MONGO_URI');
    console.error('in backend/.env with your MongoDB Atlas cloud connection string.');
    console.error('Example: MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nurvana');
    console.error('==================================================================\n');
    process.exit(1);
  }
};

module.exports = connectDB;
