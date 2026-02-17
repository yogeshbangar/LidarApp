const mongoose = require("mongoose");

/* ===============================
   User Schema & Model
================================ */
const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      age: { type: Number },
      token: { type: String },
      refreshToken: { type: String },
      password: { type: String },
      role: { type: String, enum: ["admin", "user"], default: "user" },
      status: { type: String, enum: ["active", "inactive"], default: "active" },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
const User = mongoose.model("User", userSchema);

module.exports = User;