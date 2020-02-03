$(document).ready(function(){
    var socket = io()
    var sender   = $('#sender').val()
    var receiver = $('#receiver').val()
    // var uname    = $('#uname').val()
    socket.on('connect', function(){
        var params = {
            sender:   sender,
            receiver: receiver,
            id:     socket.id  
        }
        var params2 = {
            sender:   'no',
            receiver: receiver,
            id:     socket.id 
        }
        if(sender != receiver){
            socket.emit('joinRequest', params, function(){
                console.log('joined')
            })
        }else{
            socket.emit('joinRequest', params2, function(){
                console.log('same')
            })
        }
    })
    socket.on('newFriendRequest', function(data){
        console.log(data)
        $('#reload').load(location.href);

        $(document).on('click', '#accept_friend', function(){
            var senderId = $('#senderId').val();
            var senderName = $('#senderName').val();

            $.ajax({
                url: '/group/'+room,
                type: 'POST',
                data: {
                    senderId: senderId,
                    senderName: senderName
                },
                success: function(){
                    $(this).parent().eq(1).remove();
                }
            });
            $('#reload').load(location.href + ' #reload');
        });
        
        $(document).on('click', '#cancel_friend', function(){
            var user_Id = $('#user_Id').val();

            $.ajax({
                url: '/group/'+room,
                type: 'POST',
                data: {
                    user_Id: user_Id
                },
                success: function(){
                    $(this).parent().eq(1).remove();
                }
            });
            $('#reload').load(location.href + ' #reload');
        });
    })

    $('#send').on('click', function(e){
        console.log("#send")
        // console.log(receiver)
        var data = {
            receiver: receiver,
            sender: sender,
            id    : socket.id
        }
        socket.emit('friendRequest',data, function(){
                    console.log('Request Sent')})
        // $.ajax({
        //     url: '/user/' + receiver,
        //     type: 'POST',
        //     data: {
        //         receiverName: receiver
        //     },
        //     success: function(){
        //         socket.emit('friendRequest', {
        //             receiver: receiver,
        //             sender: sender
        //         }), function(){
        //             console.log('Request Sent')
        //         }
        //     }
        // })
    })
})
