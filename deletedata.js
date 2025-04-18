const mongoose = require("mongoose");
const Listing = require("./models/listing"); // Assuming the Listing model is in the models folder
const user = require("./models/user"); // Assuming the Listing model is in the models folder

const MONGO_URL = 'mongodb://127.0.0.1:27017/stayease'; // Replace with your MongoDB URL

async function deleteAllData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Delete all data in the Listing collection
    const result = await user.deleteMany({});
    console.log(`Deleted ${result.deletedCount} listings.`);

  } catch (err) {
    console.error("Error deleting data:", err);
  } finally {
    mongoose.connection.close(); // Close the connection after deletion
  }
}

deleteAllData();
