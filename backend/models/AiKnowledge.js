const mongoose = require('mongoose');
const {EMBEDDING_DIMENSIONS, EMBEDDING_MODEL} = require('../services/embeddingService');
const schema = new mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true, maxlength: 12000},
  embedding: {type: [Number], required: true, validate: value => value.length === EMBEDDING_DIMENSIONS && value.every(Number.isFinite)},
  embeddingModel: {type: String, default: EMBEDDING_MODEL, enum: [EMBEDDING_MODEL]},
}, {timestamps: true, collection: 'ai_knowledge'});
module.exports = mongoose.model('AiKnowledge', schema);
