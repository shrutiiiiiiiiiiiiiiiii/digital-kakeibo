const mongoose = require("mongoose");
const env = require("./env");

async function connectToDatabase() {
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
}

module.exports = { connectToDatabase };
