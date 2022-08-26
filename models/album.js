const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const albumSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
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
  createdAt: {
    type: String,
    required: true,
  },
  sharedTo: [
    {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
  ],
});

module.exports = mongoose.model("Album", albumSchema);
