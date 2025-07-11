const mongoose = require('mongoose');

const rateLogSchema = new mongoose.Schema({
  token: { type: String, required: true },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  success: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('RateLog', rateLogSchema);
