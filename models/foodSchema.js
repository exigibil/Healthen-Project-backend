const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  categories: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  groupBloodNotAllowed: {
    type: [Boolean],
    default: [null, false, false, false, false],
  },
});

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;
