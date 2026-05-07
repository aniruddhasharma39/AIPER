const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
  s_no: { type: Number, unique: true },
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Micro', 'Chemical'], required: true },
  unit: { type: String, required: true }
}, { timestamps: true });

// Auto-increment s_no before saving
parameterSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const lastParam = await this.constructor.findOne({}, {}, { sort: { 's_no': -1 } });
      this.s_no = lastParam && lastParam.s_no ? lastParam.s_no + 1 : 1;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Parameter', parameterSchema);
