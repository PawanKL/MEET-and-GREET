const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  title: {
      type: String,
      default: 'No title'
  },
  body: {
    type: String,
    required: true
  },
  comments: [
    {
      userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      username: {type: String, required: true},
      comment: {type: String, required: true}
    }
  ],
  likes: [
    {
      userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      username: {type: String, required: true},
    }
    
  ],
  totalLikes: {type: Number,
  default: 0},
  totalComments: {type: Number,
  default: 0},
  date: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post