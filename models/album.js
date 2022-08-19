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
});

module.exports = mongoose.model("Album", albumSchema);
