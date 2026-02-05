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
    },
    { timestamps: true }
  );
  
const Game = mongoose.model("Game", gameSchema);

module.exports = Game;