// Import modules
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());

/* ===============================
   MongoDB Connection
================================ */
mongoose
  .connect("mongodb://127.0.0.1:27017/myapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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

/* ===============================
   Routes
================================ */

// GET all users (FETCH from MongoDB)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
app.post("/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update user
app.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE user
app.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ===============================
   Start Server
================================ */
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
