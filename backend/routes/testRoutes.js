const express = require('express');
const router = express.Router();
const TestBlueprint = require('../models/TestBlueprint');
const TestInstance = require('../models/TestInstance');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const Job = require('../models/Job');

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

// Get instances based on role
router.get('/instances', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'HEAD') {
      // HEAD sees: instances they created (PENDING, PENDING_HEAD_REVIEW)
      query = { createdBy: req.user._id };
    } else if (req.user.role === 'LAB_HEAD') {
      // LAB_HEAD sees: all instances awaiting their review
      query = { status: 'PENDING_LAB_HEAD_REVIEW' };
    } else if (req.user.role === 'ASSISTANT') {
      // ASSISTANT sees: only their PENDING tasks
      query = { assignedTo: req.user._id, status: 'PENDING' };
    }
    // ADMIN sees all (no filter)

    let instances = await TestInstance.find(query)
      .populate('blueprintId', 'name parameters')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name department')
      .populate('reviewHistory.by', 'name')
      .sort({ deadline: 1 });

    // Mask client name for ASSISTANT
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

// Head dispatches a test to an assistant
router.post('/instances', protect, authorize('HEAD'), async (req, res) => {
  try {
    const { blueprintId, jobId, deadline, assignedTo } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const testCode = '#UL-' + Math.floor(1000 + Math.random() * 9000) + 'X';

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

    // Update job distribution status to ASSIGNED_TO_ASSISTANT
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

// ASSISTANT fills in results and submits for HEAD review
router.put('/instances/:id/results', protect, authorize('ASSISTANT'), async (req, res) => {
  try {
    const { results } = req.body;
    const instance = await TestInstance.findOne({ _id: req.params.id, assignedTo: req.user._id });

    if (!instance) return res.status(404).json({ message: 'Test not found or not assigned to you' });
    if (instance.status !== 'PENDING') return res.status(400).json({ message: 'Test is not in a submittable state' });

    instance.results = results;
    // Move to HEAD review — NOT completed yet
    instance.status = 'PENDING_HEAD_REVIEW';
    // Clear previousResults since this is a fresh submission
    instance.previousResults = [];

    await instance.save();

    res.json(instance);
  } catch (err) {
    res.status(500).json({ message: 'Error updating results' });
  }
});

// HEAD reviews an instance: APPROVE (→ PENDING_LAB_HEAD_REVIEW) or REASSIGN (→ PENDING)
router.put('/instances/:id/review', protect, authorize('HEAD'), async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!['APPROVE', 'REASSIGN'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be APPROVE or REASSIGN.' });
    }

    const instance = await TestInstance.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!instance) return res.status(404).json({ message: 'Instance not found or not yours to review' });
    if (instance.status !== 'PENDING_HEAD_REVIEW') {
      return res.status(400).json({ message: 'Instance is not awaiting HEAD review' });
    }

    // Log this review action
    instance.reviewHistory.push({
      action,
      by: req.user._id,
      role: 'HEAD',
      note: note || ''
    });

    if (action === 'APPROVE') {
      instance.status = 'PENDING_LAB_HEAD_REVIEW';
    } else {
      // REASSIGN: snapshot current results for reference, clear values, send back to PENDING
      instance.previousResults = instance.results.map(r => ({ ...r.toObject() }));
      instance.results = instance.results.map(r => ({
        ...r.toObject(),
        value: '' // wipe values — assistant must re-enter
      }));
      instance.status = 'PENDING';
    }

    await instance.save();
    res.json(instance);
  } catch (err) {
    res.status(500).json({ message: 'Error processing review', error: err.message });
  }
});

// LAB_HEAD reviews an instance: APPROVE (→ COMPLETED) or REASSIGN (→ PENDING)
router.put('/instances/:id/lab-review', protect, authorize('LAB_HEAD'), async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!['APPROVE', 'REASSIGN'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be APPROVE or REASSIGN.' });
    }

    const instance = await TestInstance.findById(req.params.id);
    if (!instance) return res.status(404).json({ message: 'Instance not found' });
    if (instance.status !== 'PENDING_LAB_HEAD_REVIEW') {
      return res.status(400).json({ message: 'Instance is not awaiting LAB_HEAD review' });
    }

    // Log this review action
    instance.reviewHistory.push({
      action,
      by: req.user._id,
      role: 'LAB_HEAD',
      note: note || ''
    });

    if (action === 'APPROVE') {
      instance.status = 'COMPLETED';
      instance.completedAt = new Date();

      // Only now update job distribution status to COMPLETED
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
    } else {
      // REASSIGN: snapshot results, wipe values, back to PENDING
      instance.previousResults = instance.results.map(r => ({ ...r.toObject() }));
      instance.results = instance.results.map(r => ({
        ...r.toObject(),
        value: ''
      }));
      instance.status = 'PENDING';
    }

    await instance.save();
    res.json(instance);
  } catch (err) {
    res.status(500).json({ message: 'Error processing lab review', error: err.message });
  }
});

module.exports = router;
