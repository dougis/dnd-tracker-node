const mongoose = require('mongoose');

const CharacterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  race: {
    type: String,
  },
  class: {
    type: String,
  },
  dexterity: {
    type: Number,
    default: 10,
  },
  ac: {
    type: Number,
    default: 10,
  },
  maxHp: {
    type: Number,
    default: 10,
  },
  currentHp: {
    type: Number,
    default: 10,
  },
});

module.exports = mongoose.model('Character', CharacterSchema);
