const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const TestInstance = require('../models/TestInstance');
const Notification = require('../models/Notification');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { createNotification, notifyAdmins, notifyLabHeads } = require('../utils/notifier');

// Get all jobs based on role
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'HEAD') {
      // Head sees jobs assigned to their department
      query = {
        $or: [
          { 'distribution.micro.assignedTo': req.user._id },
          { 'distribution.macro.assignedTo': req.user._id }
        ]
      };
    }
    // LAB_HEAD and ADMIN see all jobs.
    const jobs = await Job.find(query)
      .populate('createdBy', 'name email')
      .populate('distribution.micro.assignedTo', 'name')
      .populate('distribution.macro.assignedTo', 'name')
      .sort({ createdAt: -1 });

    // We want to fetch the associated test instances for timeline across all roles
    const jobsWithTimeline = await Promise.all(jobs.map(async (job) => {
      const instances = await TestInstance.find({ jobId: job._id })
        .populate('assignedTo', 'name')
        .sort({ createdAt: 1 });
      return { ...job.toObject(), testInstances: instances };
    }));
    return res.json(jobsWithTimeline);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Create a new job (LAB_HEAD only)
router.post('/', protect, authorize('LAB_HEAD'), async (req, res) => {
  try {
    const { customer, sample, compliance, distribution } = req.body;

    const jobCode = 'JOB-' + Math.floor(1000 + Math.random() * 9000);

    const job = await Job.create({
      jobCode,
      // Populate legacy clientName from customer.customer_name for backward compat
      clientName: customer?.customer_name,
      totalSampleVolume: parseFloat(sample?.sample_quantity) || 0,
      customer,
      sample,
      compliance,
      distribution,
      createdBy: req.user._id
    });

    // Notify Admins
    await notifyAdmins({
      type: 'INFO',
      title: 'New Job Logged',
      message: `Job ${jobCode} for client ${customer?.customer_name} has been created.`,
      relatedJobId: job._id
    });

    // Notify assigned HEADs
    if (distribution?.micro?.required && distribution.micro.assignedTo) {
      await createNotification({
        recipient: distribution.micro.assignedTo,
        type: 'ACTION_REQUIRED',
        title: 'New Job Dispatched',
        message: `Job ${jobCode} requires MICRO department analysis.`,
        relatedJobId: job._id
      });
    }

    if (distribution?.macro?.required && distribution.macro.assignedTo) {
      await createNotification({
        recipient: distribution.macro.assignedTo,
        type: 'ACTION_REQUIRED',
        title: 'New Job Dispatched',
        message: `Job ${jobCode} requires CHEMICAL department analysis.`,
        relatedJobId: job._id
      });
    }

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// Delete a job
router.delete('/:id', protect, authorize('LAB_HEAD', 'ADMIN'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Delete associated TestInstances
    await TestInstance.deleteMany({ jobId: job._id });
    
    // Delete associated Notifications
    await Notification.deleteMany({ relatedJobId: job._id });

    // Delete the job itself
    await Job.findByIdAndDelete(job._id);

    res.json({ message: 'Job and associated records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
});

module.exports = router;
