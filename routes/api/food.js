const express = require("express");
const router = express.Router();
const Joi = require("joi");
const mongoose = require("mongoose");
const Food = require("../../models/foodSchema");
const authenticate = require("../api/authMiddleware");
const Diary = require("../../models/diarySchema");

const postSchema = Joi.object({
    foodItems: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            grams: Joi.number().required(), 
            date: Joi.date().optional() 
        })
    ).required(),
});
  
// const putSchema = Joi.object({
//     name: Joi.string().required(),
//     grams: Joi.string().required(),
//     title: Joi.string().required(),
//   });


// Route GET for all foods
router.get("/", authenticate, async (req, res) => {
    console.log('Request object:', req); 

    try {
        const data = await Food.find({});
        console.log('Fetched data:', data);
        
        if (data.length === 0) {
            return res.status(404).json({ message: "No documents found" });
        }
        
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching food data:", error);
        res.status(500).json({ message: error.message });
    }
});




// Route GET by ID
// router.get("/:foodId", authenticate, async (req, res) => {
//     try {
//         const foodId = req.params.foodId;
  
//         if (!mongoose.Types.ObjectId.isValid(foodId)) {
//             return res.status(400).json({ error: "Food ID is not valid" });
//         }
  
//         const food = await Food.findById(foodId);
//         if (food) {
//             res.status(200).json(food);
//         } else {
//             res.status(404).json({ error: "Food not found" });
//         }
//     } catch (err) {
//         console.error("Error fetching food by ID:", err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });


// Route post add food to Diary

router.post('/add-diary', authenticate, async (req, res) => {
    const { error } = postSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { foodItems } = req.body;
    const owner = req.user._id; 

    try {
        const newDiaryEntry = new Diary({
            owner,
            foodItems
        });

        await newDiaryEntry.save();
        res.status(201).json({ message: 'Diary entry added successfully', diary: newDiaryEntry });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Route GET diary entries by owner



router.get("/diary", authenticate, async (req, res) => {
    console.log('Request user:', req.user); 
    try {
        // Verifică dacă req.user._id este deja un ObjectId
        const owner = req.user._id; 
        console.log('Owner ID:', owner);

        // Obține toate intrările din jurnal pentru utilizatorul autenticat
        const diaryEntries = await Diary.find({ owner });
        console.log('Diary entries found:', diaryEntries);

        if (diaryEntries.length === 0) {
            return res.status(404).json({ message: "No diary entries found" });
        }

        res.status(200).json(diaryEntries);
    } catch (error) {
        console.error("Error fetching diary entries:", error);
        res.status(500).json({ message: error.message });
    }
});



module.exports = router;
