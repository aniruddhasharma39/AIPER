const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobCode: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  totalSampleVolume: { type: Number, required: true },
  distribution: {
    micro: {
      required: { type: Boolean, default: false },
      volume: { type: Number },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['PENDING', 'ASSIGNED_TO_ASSISTANT', 'COMPLETED'], default: 'PENDING' },
      reopenInfo: {
        parentInstanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestInstance' },
        parentVersion: { type: Number },
        note: { type: String }
      }
    },
    macro: {
      required: { type: Boolean, default: false },
      volume: { type: Number },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['PENDING', 'ASSIGNED_TO_ASSISTANT', 'COMPLETED'], default: 'PENDING' },
      reopenInfo: {
        parentInstanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestInstance' },
        parentVersion: { type: Number },
        note: { type: String }
      }
    }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
