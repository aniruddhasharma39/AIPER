const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const TestInstance = require('../models/TestInstance');
const Notification = require('../models/Notification');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { createNotification, notifyAdmins, notifyLabHeads } = require('../utils/notifier');

const User = require('../models/User');

// Get all jobs based on role
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'HEAD') {
      const dept = req.user.department ? req.user.department.toLowerCase() : '';
      if (dept === 'micro') {
        query = { 'distribution.micro.required': true };
      } else if (dept === 'macro' || dept === 'chemical') {
        query = { 'distribution.macro.required': true };
      } else {
        query = { _id: null }; // Should not happen
      }
    }
    // LAB_HEAD and ADMIN see all jobs.
    const jobs = await Job.find(query)
      .populate('createdBy', 'name email')
      .populate('parameters.parameterId', 'name unit type')
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
    const { customer, sample, compliance, parameters } = req.body;
    const jobCode = 'JOB-' + Math.floor(1000 + Math.random() * 9000);

    const hasMicro = parameters && parameters.some(p => p.type === 'Micro');
    const hasMacro = parameters && parameters.some(p => p.type === 'Chemical');

    const distribution = {
      micro: { required: hasMicro, status: 'PENDING' },
      macro: { required: hasMacro, status: 'PENDING' }
    };

    const job = await Job.create({
      jobCode,
      clientName: customer?.customer_name || 'Legacy Client',
      totalSampleVolume: parseFloat(sample?.sample_quantity) || 0,
      customer,
      sample,
      compliance,
      parameters,
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

    // Notify all relevant HEADs
    if (hasMicro) {
      const microHeads = await User.find({ role: 'HEAD', department: { $regex: /^micro$/i } });
      for (const head of microHeads) {
        await createNotification({
          recipient: head._id,
          type: 'ACTION_REQUIRED',
          title: 'New Job Available',
          message: `Job ${jobCode} requires MICRO department analysis.`,
          relatedJobId: job._id
        });
      }
    }
    if (hasMacro) {
      const macroHeads = await User.find({ role: 'HEAD', department: { $regex: /^(macro|chemical)$/i } });
      for (const head of macroHeads) {
        await createNotification({
          recipient: head._id,
          type: 'ACTION_REQUIRED',
          title: 'New Job Available',
          message: `Job ${jobCode} requires CHEMICAL department analysis.`,
          relatedJobId: job._id
        });
      }
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
