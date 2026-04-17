const mongoose = require('mongoose');

const resultParameterSchema = new mongoose.Schema({
  parameterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String }, // copied from blueprint
  value: { type: String }, // filled by assistant
  unit: { type: String },
  referenceRange: { type: String }
});

const testInstanceSchema = new mongoose.Schema({
  blueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestBlueprint', required: true },
  testCode: { type: String, required: true, unique: true }, // e.g. #UL-782X
  clientName: { type: String, required: true },
  deadline: { type: Date, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
  results: [resultParameterSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TestInstance', testInstanceSchema);
