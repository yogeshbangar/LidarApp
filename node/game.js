const mongoose = require("mongoose");

/* ===============================
   Game Schema & Model
================================ */
const gameSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      image: { type: String, required: true },
      link: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      createdBy: { type: String, required: true },
      updatedBy: { type: String, required: true },
    },
    { timestamps: true }
  );
  
const Game = mongoose.model("Game", gameSchema);

module.exports = Game;