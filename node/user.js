const mongoose = require("mongoose");

/* ===============================
   User Schema & Model
================================ */
const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      age: { type: Number },
    },
    { timestamps: true }
  );
  
const User = mongoose.model("User", userSchema);

module.exports = User;