const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  referenceRange: { type: String, required: true }
});

const testBlueprintSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  department: { type: String, required: true }, // Micro, Macro
  parameters: [parameterSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('TestBlueprint', testBlueprintSchema);
