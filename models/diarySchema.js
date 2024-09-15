const mongoose = require("mongoose");

const diarySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodItems: [
      {
        name: {
          type: String,
          required: true,
        },
        grams: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        calories: {
          type: Number,
          required: true,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "diary" }
);

const Diary = mongoose.model("Diary", diarySchema);

module.exports = Diary;
