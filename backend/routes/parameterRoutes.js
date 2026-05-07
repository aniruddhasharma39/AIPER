const express = require('express');
const router = express.Router();
const Parameter = require('../models/Parameter');
const { protect } = require('../middlewares/authMiddleware');

// Get all parameters, optionally search by name
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    const parameters = await Parameter.find(query).sort({ name: 1 });
    res.json(parameters);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching parameters', error: err.message });
  }
});

// Add a new parameter
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, unit } = req.body;
    
    // Check if exists
    const existing = await Parameter.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Parameter with this name already exists' });
    }

    const parameter = await Parameter.create({ name, type, unit });
    res.status(201).json(parameter);
  } catch (err) {
    res.status(500).json({ message: 'Error creating parameter', error: err.message });
  }
});

module.exports = router;
