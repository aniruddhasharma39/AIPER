const express = require('express');
const router = express.Router();
const TestBlueprint = require('../models/TestBlueprint');
const TestInstance = require('../models/TestInstance');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// --- BLUEPRINTS ---

// Head creates a test blueprint
router.post('/blueprints', protect, authorize('LAB_HEAD', 'HEAD'), async (req, res) => {
  try {
    const { name, department, parameters } = req.body;
    const blueprint = await TestBlueprint.create({
      name,
      department,
      parameters,
      createdBy: req.user._id
    });
    res.status(201).json(blueprint);
  } catch (err) {
    res.status(500).json({ message: 'Error creating blueprint', error: err.message });
  }
});

// Get all blueprints
router.get('/blueprints', protect, authorize('ADMIN', 'LAB_HEAD', 'HEAD'), async (req, res) => {
  try {
    const blueprints = await TestBlueprint.find().populate('createdBy', 'name');
    res.json(blueprints);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching blueprints' });
  }
});

// --- TEST INSTANCES ---

// Admin/Head get tests (Admin sees all, Head sees their department's tests)
// Assistant gets their assigned pending tasks
router.get('/instances', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'HEAD') {
      // Find blueprints created by this head or in their department
      query = { createdBy: req.user._id }; 
    } else if (req.user.role === 'ASSISTANT') {
      query = { assignedTo: req.user._id, status: 'PENDING' };
    }

    let instances = await TestInstance.find(query)
      .populate('blueprintId', 'name')
      .populate('assignedTo', 'name')
      .sort({ deadline: 1 });

    // Mascarade Client Name for Assistant
    if (req.user.role === 'ASSISTANT') {
      instances = instances.map(i => {
        let doc = i.toObject();
        doc.clientName = '***HIDDEN***';
        return doc;
      });
    }

    res.json(instances);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching instances' });
  }
});

const Job = require('../models/Job');

// Head assigns a test to an assistant
router.post('/instances', protect, authorize('HEAD'), async (req, res) => {
  try {
    const { blueprintId, jobId, deadline, assignedTo } = req.body;
    
    // Fetch Job to get clientName
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Generate test code randomly
    const testCode = '#UL-' + Math.floor(1000 + Math.random() * 9000) + 'X';

    // Populate empty results based on blueprint
    const blueprint = await TestBlueprint.findById(blueprintId);
    if (!blueprint) return res.status(404).json({ message: 'Blueprint not found' });

    const initialResults = blueprint.parameters.map(p => ({
      parameterId: p._id,
      name: p.name,
      value: '',
      unit: p.unit,
      referenceRange: p.referenceRange
    }));

    const instance = await TestInstance.create({
      jobId,
      blueprintId,
      testCode,
      clientName: job.clientName,
      deadline,
      assignedTo,
      results: initialResults,
      createdBy: req.user._id
    });

    // Update job distribution status
    const dept = req.user.department ? req.user.department.toLowerCase() : 'micro';
    if (job.distribution && job.distribution[dept]) {
      job.distribution[dept].status = 'ASSIGNED_TO_ASSISTANT';
      await job.save();
    }

    res.status(201).json(instance);
  } catch (err) {
    res.status(500).json({ message: 'Error creating instance', error: err.message });
  }
});

// Assistant fills in results
router.put('/instances/:id/results', protect, authorize('ASSISTANT'), async (req, res) => {
  try {
    const { results } = req.body;
    const instance = await TestInstance.findOne({ _id: req.params.id, assignedTo: req.user._id });
    
    if (!instance) return res.status(404).json({ message: 'Test not found or not assigned to you' });
    if (instance.status === 'COMPLETED') return res.status(400).json({ message: 'Test already completed' });

    instance.results = results;
    instance.status = 'COMPLETED';
    instance.completedAt = new Date();
    
    await instance.save();

    // Update job distribution status
    const Job = require('../models/Job');
    const job = await Job.findById(instance.jobId);
    if (job) {
      if (job.distribution.micro.required && String(job.distribution.micro.assignedTo) === String(instance.createdBy)) {
        job.distribution.micro.status = 'COMPLETED';
      }
      if (job.distribution.macro.required && String(job.distribution.macro.assignedTo) === String(instance.createdBy)) {
        job.distribution.macro.status = 'COMPLETED';
      }
      await job.save();
    }

    res.json(instance);
  } catch (err) {
    res.status(500).json({ message: 'Error updating results' });
  }
});

module.exports = router;
