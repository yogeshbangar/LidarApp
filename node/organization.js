const mongoose = require("mongoose");

/* ===============================
   User Schema & Model
================================ */
const organizationSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      image: { type: String, required: true },
      link: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;