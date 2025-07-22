const mongoose = require('mongoose');

const EncounterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  creatures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creature',
    },
  ],
});

module.exports = mongoose.model('Encounter', EncounterSchema);
