const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  sentRequest: [{
    username:{
      type: String,
      default: ''
    }
  }],
  request: [{
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    username: {type: String, default: ''}
    }],
  friendsList: [{
      friendId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      friendName: {type: String, default: ''}
  }],
  totalRequest: {
    type: Number,
    default: 0
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User