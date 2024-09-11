const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Food = require("../../models/foodSchema");
const authenticate = require("../api/authMiddleware");
const Diary = require("../../models/diarySchema");

const postSchema = Joi.object({
  foodItems: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        grams: Joi.number().required(),
        date: Joi.date().optional(),
      })
    )
    .required(),
});

// const putSchema = Joi.object({
//     name: Joi.string().required(),
//     grams: Joi.string().required(),
//     title: Joi.string().required(),
//   });

/**
 * @swagger
 * tags:
 *   name: Food
 *   description: API pentru gestionarea alimentelor
 */

/**
 * @swagger
 * /food:
 *   get:
 *     summary: Obține toate alimentele
 *     tags: [Food]
 *     responses:
 *       200:
 *         description: Lista de alimente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   grams:
 *                     type: number
 *                   date:
 *                     type: string
 *                     format: date
 *       500:
 *         description: Eroare server
 */

router.get("/", authenticate, async (req, res) => {
  console.log("Request object:", req);

  try {
    const data = await Food.find({});
    console.log("Fetched data:", data);

    if (data.length === 0) {
      return res.status(404).json({ message: "No documents found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching food data:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /food/aliment/{foodId}:
 *   get:
 *     summary: Obține un aliment după ID
 *     tags: [Food]
 *     parameters:
 *       - name: foodId
 *         in: path
 *         required: true
 *         description: ID-ul alimentului
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalii aliment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 grams:
 *                   type: number
 *                 date:
 *                   type: string
 *                   format: date
 *       404:
 *         description: Alimentul nu a fost găsit
 *       500:
 *         description: Eroare server
 */

router.get("/aliment/:foodId", authenticate, async (req, res) => {
  try {
    const foodId = req.params.foodId;

    const food = await Food.findById(foodId);
    if (food) {
      res.status(200).json(food);
    } else {
      res.status(404).json({ error: "Food not found" });
    }
  } catch (err) {
    console.error("Error fetching food by ID:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /food/search:
 *   get:
 *     summary: Caută alimente
 *     tags: [Food]
 *     parameters:
 *       - name: title
 *         in: query
 *         description: Titlul alimentului
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         description: Categoria alimentului
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de alimente găsite
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   category:
 *                     type: string
 *       404:
 *         description: Niciun document găsit
 *       500:
 *         description: Eroare server
 */

router.get("/search", authenticate, async (req, res) => {
  console.log("Request query:", req.query);

  const filter = {};

  if (req.query.title) {
    filter.title = { $regex: req.query.title, $options: "i" };
  }

  if (req.query.category) {
    filter.categories = req.query.category;
  }

  try {
    const data = await Food.find(filter);
    console.log("Fetched filtered data:", data);

    if (data.length === 0) {
      return res.status(404).json({ message: "No documents found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching food data:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /food/diary:
 *   get:
 *     summary: Obține înregistrările din jurnalul utilizatorului
 *     tags: [Food]
 *     responses:
 *       200:
 *         description: Lista de înregistrări din jurnal
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   foodItems:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         grams:
 *                           type: number
 *                         date:
 *                           type: string
 *                           format: date
 *       404:
 *         description: Niciun jurnal găsit
 *       500:
 *         description: Eroare server
 */

router.get("/diary", authenticate, async (req, res) => {
  try {
    const owner = req.user._id;
    const diaryEntries = await Diary.find({ owner });

    if (diaryEntries.length === 0) {
      return res.status(404).json({ message: "No diary entries found" });
    }

    res.status(200).json(diaryEntries);
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /food/day-info:
 *   get:
 *     summary: Obține înregistrările din jurnal pentru o anumită zi
 *     tags: [Food]
 *     parameters:
 *       - name: date
 *         in: query
 *         required: true
 *         description: Data pentru care se solicită informațiile
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de înregistrări din jurnal pentru data specificată
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   foodItems:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         grams:
 *                           type: number
 *                         date:
 *                           type: string
 *                           format: date
 *       400:
 *         description: Parametrul de dată este lipsă
 *       404:
 *         description: Niciun jurnal găsit pentru data specificată
 *       500:
 *         description: Eroare server
 */

router.get("/day-info", authenticate, async (req, res) => {
  const { date } = req.query;
  const owner = req.user._id;

  if (!date) {
    return res
      .status(400)
      .json({ message: "Date query parameter is required" });
  }

  const startDate = new Date(date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 1);

  try {
    const diaryEntries = await Diary.find({
      owner,
      "foodItems.date": { $gte: startDate, $lt: endDate },
    });

    if (diaryEntries.length === 0) {
      return res
        .status(404)
        .json({ message: "No diary entries found for the specified date" });
    }

    res.status(200).json(diaryEntries);
  } catch (err) {
    console.error("Error fetching diary entries for the specified date:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @swagger
 * /food/add-diary:
 *   post:
 *     summary: Adaugă o înregistrare în jurnal
 *     tags: [Food]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     grams:
 *                       type: number
 *                     date:
 *                       type: string
 *                       format: date
 *     responses:
 *       201:
 *         description: Înregistrare adăugată cu succes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 diary:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     foodItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           grams:
 *                             type: number
 *                           date:
 *                             type: string
 *                             format: date
 *       400:
 *         description: Date invalidă
 *       500:
 *         description: Eroare server
 */

router.post("/add-diary", authenticate, async (req, res) => {
  const { error } = postSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { foodItems } = req.body;
  const owner = req.user._id;

  try {
    const newDiaryEntry = new Diary({
      owner,
      foodItems,
    });

    await newDiaryEntry.save();
    res.status(201).json({
      message: "Diary entry added successfully",
      diary: newDiaryEntry,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @swagger
 * /food/remove-diary:
 *   post:
 *     summary: Elimină un aliment din jurnal
 *     tags: [Food]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodItemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Aliment eliminat cu succes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 diary:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     foodItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           grams:
 *                             type: number
 *                           date:
 *                             type: string
 *                             format: date
 *       400:
 *         description: ID-ul alimentului este lipsă
 *       404:
 *         description: Înregistrare jurnal nu a fost găsită
 *       500:
 *         description: Eroare server
 */

router.post("/remove-diary", authenticate, async (req, res) => {
  const { foodItemId } = req.body;
  const owner = req.user._id;

  if (!foodItemId) {
    return res.status(400).json({ message: "Food Item ID is required" });
  }

  try {
    const updatedDiary = await Diary.findOneAndUpdate(
      { owner, "foodItems._id": foodItemId },
      { $pull: { foodItems: { _id: foodItemId } } },
      { new: true }
    );

    if (!updatedDiary) {
      return res
        .status(404)
        .json({ message: "Diary entry not found or not authorized to modify" });
    }

    res
      .status(200)
      .json({ message: "Food item removed successfully", diary: updatedDiary });
  } catch (err) {
    console.error("Error removing food item:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @swagger
 * /food/calculator:
 *   post:
 *     summary: Calculează formula BMR și alimentele interzise public
 *     tags: [Food]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height:
 *                 type: number
 *               age:
 *                 type: number
 *               desiredWeight:
 *                 type: number
 *               bloodType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rezultatul calculelor și alimentele interzise
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 desiredFormula:
 *                   type: number
 *                 forbiddenFoods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *       500:
 *         description: Eroare server
 */

router.post("/calculator", async (req, res) => {
  const { height, age, desiredWeight, bloodType } = req.body;

  // Formula de calcul pentru BMR (Basal Metabolic Rate)
  // const curentFormula = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) + 5;
  const desiredFormula =
    10 * parseFloat(desiredWeight) +
    6.25 * parseFloat(height) -
    5 * parseFloat(age) +
    5;

  // const calories =  curentFormula - desiredFormula;
  let groupBloodIndex;
  switch (bloodType) {
    case "0":
      groupBloodIndex = 1; // tip 0
      break;
    case "A":
      groupBloodIndex = 2; //  tip A
      break;
    case "B":
      groupBloodIndex = 3; // tip B
      break;
    case "AB":
      groupBloodIndex = 4; //  tip AB
      break;
    default:
      groupBloodIndex = 0;  // null
  }

  try {
    const forbiddenFoods = await Food.find({
      [`groupBloodNotAllowed.${groupBloodIndex}`]: true,
    }).select("title");

    res.status(200).json({
      desiredFormula,
      forbiddenFoods,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /food/private/calculator:
 *   post:
 *     summary: Calculează formula BMR și alimentele interzise private
 *     tags: [Food]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height:
 *                 type: number
 *               age:
 *                 type: number
 *               desiredWeight:
 *                 type: number
 *               bloodType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rezultatul calculelor și alimentele interzise
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 desiredFormula:
 *                   type: number
 *                 forbiddenFoods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *       500:
 *         description: Eroare server
 */

router.post("/private/calculator", authenticate, async (req, res) => {
  const { height, age, desiredWeight, bloodType } = req.body;

  // Formula de calcul pentru BMR (Basal Metabolic Rate)
  // const curentFormula = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) + 5;
  const desiredFormula =
    10 * parseFloat(desiredWeight) +
    6.25 * parseFloat(height) -
    5 * parseFloat(age) +
    5;

  // const calories =  curentFormula - desiredFormula;
  let groupBloodIndex;
  switch (bloodType) {
    case "0":
      groupBloodIndex = 1; // pentru tip 0
      break;
    case "A":
      groupBloodIndex = 2; // pentru tip A
      break;
    case "B":
      groupBloodIndex = 3; // pentru tip B
      break;
    case "AB":
      groupBloodIndex = 4; // pentru tip AB
      break;
    default:
      groupBloodIndex = 0; // 0 este default pentru neselectat
  }

  try {
    const forbiddenFoods = await Food.find({
      [`groupBloodNotAllowed.${groupBloodIndex}`]: true,
    }).select("title");

    res.status(200).json({
      desiredFormula,
      forbiddenFoods,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
