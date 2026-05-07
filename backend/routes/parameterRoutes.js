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
    if (!name || !type || !unit) {
      return res.status(400).json({ message: 'name, type, and unit are all required' });
    }

    // Check if exists
    const existing = await Parameter.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: `Parameter "${name}" already exists in the library` });
    }

    // Assign s_no manually to avoid pre-save race conditions
    const last = await Parameter.findOne({}, {}, { sort: { s_no: -1 } });
    const s_no = (last && last.s_no) ? last.s_no + 1 : 1;

    const parameter = await Parameter.create({ name: name.trim(), type, unit: unit.trim(), s_no });
    res.status(201).json(parameter);
  } catch (err) {
    res.status(500).json({ message: 'Error creating parameter', error: err.message });
  }
});

module.exports = router;
