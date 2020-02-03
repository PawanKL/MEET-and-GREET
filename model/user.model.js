const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  userImage:{
    type: String,
    default: ''
  },
  about: {
    type: String,
    default: ''
  },
  follower: [
    {
      userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      username: {type: String, required: true},
    }
  ],
  following: [
    {
      userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      username: {type: String, required: true},
    }
  ],
  // request: [{
  //   userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  //   username: {type: String, default: ''}
  // }],
  // friendsList: [{
  //   friendId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  //   friendName: {type: String, default: ''}
  // }],
  // totalRequest: {type: Number, default: 0},
  // date: {
  //   type: Date,
  //   default: Date.now
  // }
});

const User = mongoose.model('User', UserSchema);

module.exports = User