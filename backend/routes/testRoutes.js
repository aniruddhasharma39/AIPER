const express = require('express');
const router = express.Router();
const TestInstance = require('../models/TestInstance');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { createNotification, notifyLabHeads, notifyAdmins } = require('../utils/notifier');

// --- TEST INSTANCES ---

// Get instances based on role
router.get('/instances', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'HEAD') {
      // HEAD sees: instances they created, excluding REOPENED
      query = { createdBy: req.user._id, status: { $ne: 'REOPENED' } };
    } else if (req.user.role === 'LAB_HEAD') {
      // LAB_HEAD sees all instances (Review Queue filters client-side for PENDING_LAB_HEAD_REVIEW)
      query = {};
    } else if (req.user.role === 'ASSISTANT') {
      // ASSISTANT sees: only their PENDING tasks
      query = { assignedTo: req.user._id, status: 'PENDING' };
    }
    // ADMIN sees all (no filter)

    let instances = await TestInstance.find(query)
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

// Head dispatches tests to assistants
router.post('/instances', protect, authorize('HEAD'), async (req, res) => {
  try {
    const { jobId, deadline, assignments, blueprintId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const dept = req.user.department ? req.user.department.toLowerCase() : 'micro';
    const clientName = (job.customer && job.customer.customer_name) || job.clientName || '';

    // Child test code convention:
    //   Micro dept  → {jobCode}-1   e.g. 2605070001-1
    //   Chemical/Macro dept → {jobCode}-2   e.g. 2605070001-2
    const deptSuffix = (dept === 'micro') ? '1' : '2';
    const baseTestCode = `${job.jobCode}-${deptSuffix}`;

    // Group assignments by assignedTo (assistant ID)
    const assistantMap = {};
    if (assignments && Array.isArray(assignments)) {
      assignments.forEach(assignment => {
        const astId = assignment.assignedTo;
        if (!assistantMap[astId]) {
          assistantMap[astId] = [];
        }
        assistantMap[astId].push({
          parameterId: assignment.parameterId,
          name: assignment.name,
          value: '',
          unit: assignment.unit,
          referenceRange: ''
        });
      });
    }

    const createdInstances = [];
    const assistantIds = Object.keys(assistantMap);

    for (let i = 0; i < assistantIds.length; i++) {
      const astId = assistantIds[i];
      const params = assistantMap[astId];

      // If multiple assistants under the same department, differentiate with a letter suffix
      // e.g. 2605070001-1a, 2605070001-1b
      const suffix = assistantIds.length > 1
        ? `${baseTestCode}${String.fromCharCode(97 + i)}` // a, b, c…
        : baseTestCode;

      // Check for duplicate testCode (in case of re-dispatch after reopen)
      const existingCount = await TestInstance.countDocuments({ testCode: { $regex: `^${suffix.replace(/-/g, '\\-')}` } });
      const testCode = existingCount > 0 ? `${suffix}-v${existingCount + 1}` : suffix;

      const instance = await TestInstance.create({
        jobId,
        testCode,
        clientName,
        deadline,
        assignedTo: astId,
        results: params,
        createdBy: req.user._id,
        ...(job.distribution[dept] && job.distribution[dept].reopenInfo && job.distribution[dept].reopenInfo.parentInstanceId ? {
          version: (job.distribution[dept].reopenInfo.parentVersion || 0) + 1,
          parentInstanceId: job.distribution[dept].reopenInfo.parentInstanceId
        } : {})
      });
      createdInstances.push(instance);

      // Notify Assistant
      await createNotification({
        recipient: astId,
        type: 'ACTION_REQUIRED',
        title: 'New Test Assigned',
        message: `You have been assigned test ${testCode} for job ${job.jobCode}.`,
        relatedJobId: jobId,
        relatedInstanceId: instance._id
      });
    }

    // Update job distribution status
    const distDept = (dept === 'chemical' || dept === 'macro') ? 'macro' : 'micro';
    if (job.distribution && job.distribution[distDept]) {
      job.distribution[distDept].status = 'ASSIGNED_TO_ASSISTANT';
      job.distribution[distDept].reopenInfo = undefined;
      await job.save();
    }

    // Notify Lab Heads
    await notifyLabHeads({
      type: 'INFO',
      title: 'Job Dispatched',
      message: `${dept.toUpperCase()} HEAD has dispatched tests for job ${job.jobCode} to analysts.`,
      relatedJobId: jobId
    });

    res.status(201).json({ message: 'Dispatched successfully', instances: createdInstances });
  } catch (err) {
    res.status(500).json({ message: 'Error creating instance', error: err.message });
  }
});

// ASSISTANT saves partial progress
router.put('/instances/:id/save-progress', protect, authorize('ASSISTANT'), async (req, res) => {
  try {
    const { results } = req.body;
    const instance = await TestInstance.findOne({ _id: req.params.id, assignedTo: req.user._id });

    if (!instance) return res.status(404).json({ message: 'Test not found or not assigned to you' });
    if (instance.status !== 'PENDING') return res.status(400).json({ message: 'Test is not in a submittable state' });

    instance.results = results;
    await instance.save();

    res.json(instance);
  } catch (err) {
    res.status(500).json({ message: 'Error saving progress' });
  }
});

// ASSISTANT fills in results and submits for HEAD review
router.put('/instances/:id/results', protect, authorize('ASSISTANT'), async (req, res) => {
  try {
    const { results, testingPeriod } = req.body;
    const instance = await TestInstance.findOne({ _id: req.params.id, assignedTo: req.user._id });

    if (!instance) return res.status(404).json({ message: 'Test not found or not assigned to you' });
    if (instance.status !== 'PENDING') return res.status(400).json({ message: 'Test is not in a submittable state' });

    instance.results = results;
    if (testingPeriod) {
      instance.testingPeriod = {
        startDate: testingPeriod.startDate || null,
        endDate: testingPeriod.endDate || null
      };
    }
    // Move to HEAD review — NOT completed yet
    instance.status = 'PENDING_HEAD_REVIEW';
    // Clear previousResults since this is a fresh submission
    instance.previousResults = [];

    await instance.save();

    // Delete the 'New Test Assigned' or 'Job Reassigned' notification for the assistant
    await Notification.deleteMany({
      recipient: req.user._id,
      relatedInstanceId: instance._id,
      $or: [{ title: 'New Test Assigned' }, { title: 'Job Reassigned' }]
    });

    // Notify HEAD for review
    await createNotification({
      recipient: instance.createdBy,
      type: 'ACTION_REQUIRED',
      title: 'Review Required',
      message: `Analyst has submitted results for test ${instance.testCode}. Pending your review.`,
      relatedJobId: instance.jobId,
      relatedInstanceId: instance._id,
      link: '/review'
    });

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

    if (action === 'APPROVE') {
      await notifyLabHeads({
        type: 'ACTION_REQUIRED',
        title: 'Final Review Required',
        message: `HEAD has approved test ${instance.testCode}. Pending your final review.`,
        relatedJobId: instance.jobId,
        relatedInstanceId: instance._id,
        link: '/review'
      });
    } else {
      await createNotification({
        recipient: instance.assignedTo,
        type: 'WARNING',
        title: 'Job Reassigned',
        message: `Your results for test ${instance.testCode} were rejected by HEAD. Please revise.`,
        relatedJobId: instance.jobId,
        relatedInstanceId: instance._id
      });

      await notifyLabHeads({
        type: 'INFO',
        title: 'Job Reassigned by HEAD',
        message: `HEAD rejected results for test ${instance.testCode} and sent it back to the analyst.`,
        relatedJobId: instance.jobId,
        relatedInstanceId: instance._id
      });
    }
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
        // Find all instances for this job
        const allInstances = await TestInstance.find({ jobId: instance.jobId }).populate('createdBy', 'department');
        
        // Helper to check if all instances created by a specific department are completed
        const isDeptCompleted = (deptName) => {
          const deptInstances = allInstances.filter(i => i.createdBy?.department?.toLowerCase() === deptName.toLowerCase());
          if (deptInstances.length === 0) return false;
          return deptInstances.every(i => i.status === 'COMPLETED');
        };

        if (job.distribution.micro.required && isDeptCompleted('micro')) {
          job.distribution.micro.status = 'COMPLETED';
        }
        if (job.distribution.macro.required && (isDeptCompleted('macro') || isDeptCompleted('chemical'))) {
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

    if (action === 'APPROVE') {
      await notifyLabHeads({
        type: 'SUCCESS',
        title: 'Job Completed',
        message: `Test ${instance.testCode} has been approved and completed. Report generated.`,
        relatedJobId: instance.jobId,
        relatedInstanceId: instance._id,
        link: '/audit'
      });
      await notifyAdmins({
        type: 'SUCCESS',
        title: 'Job Completed',
        message: `Test ${instance.testCode} has been finalized.`,
        relatedJobId: instance.jobId,
        relatedInstanceId: instance._id
      });
    } else {
      await createNotification({
        recipient: instance.assignedTo,
        type: 'WARNING',
        title: 'Job Reassigned',
        message: `Your results for test ${instance.testCode} were rejected by LAB_HEAD. Please revise.`,
        relatedJobId: instance.jobId,
        relatedInstanceId: instance._id
      });
    }

    res.json(instance);
  } catch (err) {
    res.status(500).json({ message: 'Error processing lab review', error: err.message });
  }
});

// LAB_HEAD reopens a completed instance
router.post('/instances/:id/reopen', protect, authorize('LAB_HEAD'), async (req, res) => {
  try {
    const { reopenNote, assignedHeadId } = req.body;
    if (!reopenNote) return res.status(400).json({ message: 'Reopen note is required' });

    const instance = await TestInstance.findById(req.params.id);
    if (!instance) return res.status(404).json({ message: 'Instance not found' });
    if (instance.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Only completed instances can be reopened' });
    }

    // Mark old instance as REOPENED
    instance.status = 'REOPENED';
    instance.reopenNote = reopenNote;
    instance.reopenedBy = req.user._id;
    await instance.save();

    // Reset Job distribution status to PENDING and store reopenInfo
    const job = await Job.findById(instance.jobId);
    if (job) {
      // Determine which department this instance belongs to
      const dept = ['micro', 'macro'].find(d => {
        return job.distribution[d]?.required &&
          String(job.distribution[d]?.assignedTo) === String(instance.createdBy);
      });

      if (dept) {
        job.distribution[dept].status = 'PENDING';
        job.distribution[dept].reopenInfo = {
          parentInstanceId: instance._id,
          parentVersion: instance.version,
          note: reopenNote
        };
        // Optionally change the assigned HEAD
        if (assignedHeadId) {
          job.distribution[dept].assignedTo = assignedHeadId;
        }
        await job.save();
      }
    }

    res.json({ message: 'Job reopened successfully', reopenedInstance: instance });
  } catch (err) {
    res.status(500).json({ message: 'Error reopening instance', error: err.message });
  }
});

// Get version history for an instance (walk the parentInstanceId chain)
router.get('/instances/:id/history', protect, async (req, res) => {
  try {
    const versions = [];
    let currentId = req.params.id;

    // Start from the requested instance and walk backwards
    while (currentId) {
      const inst = await TestInstance.findById(currentId)
        .populate('blueprintId', 'name')
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name department')
        .populate('reviewHistory.by', 'name')
        .populate('reopenedBy', 'name');
      if (!inst) break;
      versions.push(inst);
      currentId = inst.parentInstanceId;
    }

    // Also check if there are newer versions pointing to this instance
    let newerVersionId = req.params.id;
    while (true) {
      const newer = await TestInstance.findOne({ parentInstanceId: newerVersionId })
        .populate('blueprintId', 'name')
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name department')
        .populate('reviewHistory.by', 'name')
        .populate('reopenedBy', 'name');
      if (!newer) break;
      versions.unshift(newer); // Add newer versions at the front
      newerVersionId = newer._id;
    }

    // Sort by version descending (newest first)
    versions.sort((a, b) => b.version - a.version);

    res.json(versions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching version history', error: err.message });
  }
});

module.exports = router;
