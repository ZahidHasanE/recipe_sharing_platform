const express = require('express');
const Recipe = require('../models/Recipe');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Get All Recipes
router.get('/', async (req, res) => {
    try {
        const recipes = await Recipe.find().populate('user', 'username');
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Recipe
router.post('/', async (req, res) => {
    try {
        const { title, ingredients, instructions, user } = req.body;
        const newRecipe = new Recipe({ title, ingredients, instructions, user });
        await newRecipe.save();

        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', upload.single('image'), async (req, res) => {
    const { title, ingredients, instructions, user } = req.body;
    const image = req.file ? req.file.path : null;

    const newRecipe = new Recipe({ title, ingredients, instructions, image, user });
    await newRecipe.save();

    res.status(201).json(newRecipe);
});

module.exports = router;
