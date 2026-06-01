const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  smmApiUrl: { type: String, default: '' },
  smmApiKey: { type: String, default: '' },
  
  // By using "type: Object", MongoDB will accept ANY new service you invent!
  serviceMappings: { 
    type: Object, 
    default: { followers: '', likes: '', views: '' } 
  },
  
  prices: { 
    type: Object, 
    default: { followers: 80, likes: 40, views: 10 } 
  }
});

module.exports = mongoose.model('Settings', settingsSchema);