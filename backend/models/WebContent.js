const mongoose = require("mongoose");

const boxSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "" },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    emoji: { type: String, default: "" },
    icon: { type: String, default: "" },
  },
  { _id: false }
);

const webContentSchema = new mongoose.Schema(
  {
    boxes: { type: [boxSchema], default: [] },
  },
  { timestamps: true, collection: "WebContent" }
);

module.exports = mongoose.model("WebContent", webContentSchema);