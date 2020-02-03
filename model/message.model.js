const mongoose = require('mongoose');

var MessageSchema = mongoose.Schema({
    message: {type: String},
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    senderName: {type: String},
    userImage: {type: String, default: ''},
    receiverName: {type: String},
    isRead: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now}
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;