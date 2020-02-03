module.exports = function(io){
    var sid = ""
    var rid = ""
    io.on('connection', (socket)=>{
        socket.on('joinRequest', (myRequest, callback) => {
            // sid = myRequest.id
            if(myRequest.sender != 'no'){
                sid = myRequest.id
                socket.join(myRequest.sender)
            }
            rid = myRequest.id
            callback()
        })
        socket.on('friendRequest', (friend, callback) => {
            // io.of(friend.sender).emit('newFriendRequest', friend)
            // io.emit('newFriendRequest', friend);
            socket.broadcast.to(rid).emit('newFriendRequest', friend)
            callback()
        })
    })
}