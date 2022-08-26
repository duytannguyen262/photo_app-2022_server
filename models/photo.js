const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const photoSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  resolution: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
  ofAlbums: [
    {
      type: Schema.Types.ObjectId,
      ref: "albums",
    },
  ],
  sharedTo: [
    {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
  ],
  author: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  public: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("Photo", photoSchema);
