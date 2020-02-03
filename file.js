module.exports = function(io){
    var  dl  = require('delivery')
    var  fs  = require('fs');
    io.sockets.on('connection', function(socket){
        var delivery = dl.listen(socket);
        delivery.on('receive.success',function(file){
          var params = file.params;
          fs.writeFile(file.name,file.buffer, function(err){
            if(err){
              console.log('File could not be saved.');
            }else{
              console.log('File saved.');
            };
          });
        });
      });
}