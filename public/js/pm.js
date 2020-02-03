$(document).ready(function(){
    var socket = io();
    
    var paramOne = $.deparam(window.location.pathname);
    console.log(paramOne)
    var newParam = paramOne.split('.');
    
    var username = newParam[0];
    $('#receiver_name').text('@'+username);
    
    swap(newParam, 0, 1);
    var paramTwo = newParam[0]+'.'+newParam[1];
    
    socket.on('connect', function(){
        var params = {
           room1: paramOne,
           room2: paramTwo
        }
        console.log('client connect') 
       
        socket.emit('join PM', params);
        
        // socket.on('message display', function(){
        //     $('#reload').load(location.href + ' #reload');
        // });
        
        // socket.on('new refresh', function(){
        //     $('#reload').load(location.href + ' #reload');
        // });
    });
    
    socket.on('new message', function(data){
        // var template = $('#message-template').html();
        // var message = Mustache.render(template, {
        //     text: data.text,
        //     sender: data.sender
        // });
        console.log(username)
        if(username == data.sender){
            var template = $('#message-template').html();
            // console.log(template)
            // console.log(data)
            // console.log(template.childNodes[1])
            var message = Mustache.render(template, {
                sender: data.sender,
                text:   data.text
            });
            $('#smsg').append(message);
        }else{
            var template = $('#message-template1').html();
            console.log(template)
        // console.log(data)
        // console.log(template.childNodes[1])
            var message = Mustache.render(template, {
                sender: data.sender,
                text:   data.text
            });
            $('#rmsg').append(message);
        }
       
    });
    
    $('#message_form').on('submit', function(e){
        e.preventDefault();
        
        var msg = $('#msg').val();
        var sender = $('#user_name').val();
        
        if(msg.trim().length > 0){
            socket.emit('private message', {
                text: msg,
                sender: sender,
                room: paramOne
            }, function(){
                $('#msg').val('');
            });
        }
    });
    
    $('#msg_send_btn').on('click', function(){
        var message = $('#msg').val();
        
        $.ajax({
            url:'/chat/'+paramOne,
            type: 'POST',
            data: {
                message: message
            },
            success: function(){
                $('#msg').val('');
            }
        })
    });
});

function swap(input, value_1, value_2){
    var temp = input[value_1];
    input[value_1] = input[value_2];
    input[value_2] = temp;
}


























