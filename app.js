const express    = require('express')
      bodyParser = require('body-parser')
      app        = express()
      server     = require('http').Server(app)
      port       = 3000  || process.env.PORT
      io         = require('socket.io')(server)
      session    = require('express-session')
      mongoose   = require('mongoose')
      db         = require('./db')
      User       = require('./model/user.model')
      Post       = require('./model/post.model')
      Message    = require('./model/message.model')
      formidable  = require('formidable')
      fs           = require('fs')
      privatechat    = require('./socket/private')(io)
      friend    = require('./socket/friend')(io)
    //   filesend  = require('./file')(io)
      os         = require('os')
      path       = require('path')
      async      = require('async')
    //   dl =          require('delivery')
    nodemailer  = require('nodemailer')
db.connect()
// console.log(getUserId('pawan'))
// changedb('pawan')
// console.log(socket)
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs') 
app.use(session(
    {
        secret: "Hello World",
        resave: true,
        saveUninitialized: true

    }
))
app.use(function(req, res, next){
    res.locals.user        = req.session.username
    res.locals.totalUsers = [] 
    res.locals.uData = req.session.data
    next()
}) 

function getPosts(req, res){
    
    var query = Post.find({})
    return query
}

app.get('/sendfile', (req, res)=>{
    res.render('filesend.ejs')
})

app.get('/', (req, res)=>{
   if(req.session.username){
    //    getPosts(req, res, req.session.username)
    return res.render('index', {user: res.locals.user})
   }
   res.render('index', {user: null})
})
app.get('/user/:id', (req, res)=>{
    if(req.session.username){
        const username = req.params.id
        async.parallel([
            function(callback){
                User.findOne({'username': username})
                    .populate('request.userId')
                    .exec((err, result) => {
                        callback(err, result)
                    })
            }
        ], (err, results) =>{
            // console.log(results[0])
            // res.send('Hello')
            req.session.data = results[0]
            // console.log(req.session.data)
            console.log(results[0])
            return res.render('user', {profile: results[0]})
        })
        // User.findOne({username: username},(err, user)=>{
        //     if(!err){
        //         if(user){
        //             // console.log(user)
        //             return res.render('user', {profile: user})
        //         }
        //         return 
        //     }
        //     return res.redirect('/NotFound')
        // })
        // return 
    }
    // res.redirect('/')
})

app.post('/user/:id', (req, res) =>{
    console.log('in /friend')
   if(req.body.receiverName){
       console.log('server fr')
    user = req.session.user
    // console.log(user)
    async.parallel([function(callback) {
        console.log('receiver side')
        if(req.body.receiverName){
                User.updateOne({
                    'username': req.session.username,
                    'sentRequest.username': {$ne: req.body.receiverName}
                },
                {
                    $push: {sentRequest: {
                    username: req.body.receiverName
                    }}
                    },(err, count) => {
                    callback(err, count);
                    })
        }
        },function(callback) {
                if(req.body.receiverName) {
                    console.log('updataing....')
                        User.updateOne({
                            'username': req.body.receiverName,
                            'request.userId': {$ne: user._id},
                            'friendsList.friendId': {$ne: user._id}
                        }, 
                        {
                            $push: {request: {
                            userId: user._id,
                            username: req.session.username
                            }},
                            $inc: {totalRequest: 1}
                            },(err, count) =>  {
                                console.log(err);
                                callback(err, count);
                        })
                }
		}],
	(err, results)=>{
		res.redirect('/user/' + req.params.id);
	});
   }
})


app.get('/NotFound', (req, res)=>{
    res.send('database error')
})
app.post('/login', (req, res)=>{
    if(!req.session.username){
        var user = {
            email       : req.body.email,
            password    : req.body.password
        }
        User.findOne({$and: [{'email': user.email}, {'password': user.password}]}, (err, user)=>{
           if(!err){
                if(user){
                    req.session.username = user.username
                    req.session.user = user
                    // console.log('in if(user)')
                    res.redirect('/')
                }
                
           }else{
            return res.redirect('/NotFound')
           }
        })
        return
    }
    return res.render('index', {user: res.locals.user})
});

app.get('/chat/:id', (req, res)=>{
    if(req.session.username){
        async.parallel([
            function(callback){
                User.findOne({'username': req.session.username},(err, result) => {
                        callback(err, result);
                    })
            },
            
            function(callback){
                const nameRegex = new RegExp("^" + req.session.username, "i")
                Message.aggregate([
                    {$match:{$or:[{"senderName":nameRegex}, {"receiverName":nameRegex}]}},
                    {$sort:{"createdAt":-1}},
                    {
                        $group:{"_id":{
                        "last_message_between":{
                            $cond:[
                                {
                                    $gt:[
                                    {$substr:["$senderName",0,1]},
                                    {$substr:["$receiverName",0,1]}]
                                },
                                {$concat:["$senderName"," and ","$receiverName"]},
                                {$concat:["$receiverName"," and ","$senderName"]}
                            ]
                        }
                        }, "body": {$first:"$$ROOT"}
                        }
                    }], function(err, newResult){
                        const arr = [
                            {path: 'body.sender', model: 'User'},
                            {path: 'body.receiver', model: 'User'}
                        ];
                        
                        Message.populate(newResult, arr, (err, newResult1) => {
                            callback(err, newResult1);
                        });
                    }
                )
            },
            
            function(callback){
                Message.find({'$or':[{'senderName':req.session.username}, {'receiverName':req.session.username}]})
                    .populate('sender')
                    .populate('receiver')
                    .exec((err, result3) => {
                        callback(err, result3)
                    })
            }
        ], (err, results) => {
            const result1 = results[0];
            console.log('result 1: ' + result1)
            const result2 = results[1];
            console.log('result 2: ' + result2)
            const result3 = results[2];
            console.log('result 3: ' + result3)
            const params = req.params.id.split('.');
            const nameParams = params[1]; 
             // , {user:req.user, data: result1, chat: result2, chats:result3, name:nameParams}
            res.render('chat', {currentUser:req.session.username, data: result1, chat: result2, chats:result3, name:nameParams});
        });
    }
})

app.post('/chat/:id', (req, res) => {
    if(req.session.username){
        const params = req.params.id.split('.');
            const nameParams = params[1];
            console.log(nameParams)
            const nameRegex = new RegExp("^"+nameParams, "i");
            
            async.waterfall([
                function(callback){
                    if(req.body.message){
                        // User.find({'username':{$regex: nameRegex}}, (err, data) => {
                        //    callback(err, data);
                        // });
                        User.find({
                            'username': { $in: [
                                nameParams,
                                req.session.username
                            ]}
                        }, (err, data)=>{
                            callback(err, data);
                        });
                    }
                },function(data,callback){
                    // console.log(data)
                    if(req.body.message){
                        const newMessage = new Message();
                        newMessage.sender = data[0]._id;
                        newMessage.receiver = data[1]._id;
                        newMessage.senderName = req.session.username;
                        newMessage.receiverName = data[1].username;
                        newMessage.message = req.body.message;
                        newMessage.userImage = data[0].userImage;
                        newMessage.createdAt = new Date();
                        
                        newMessage.save((err, result) => {
                            if(err){
                                throw err
                            }
                            callback(err, result);
                        })
                    }
                }
            ], (err, results) => {
                // console.log(results[0])
                res.redirect('/chat/'+req.session.username);
            });
    }
})

app.post('/add/friend', (req, res)=>{
    console.log('in /friend')
   if(req.body.receiverName){
       console.log('server fr')
    user = req.session.user
    console.log(user)
    async.parallel([
		function(callback) {
			if(req.body.receiverName) {
                console.log('updataing....')
					User.updateOne({
						'username': req.body.receiverName,
						'request.userId': {$ne: user._id},
						'friendsList.friendId': {$ne: user._id}
					}, 
					{
						$push: {request: {
						userId: user._id,
						username: req.session.username
						}},
						$inc: {totalRequest: 1}
						},(err, count) =>  {
							console.log(err);
							callback(err, count);
						})
			}
		},
		function(callback) {
			if(req.body.receiverName){
					User.updateOne({
						'username': req.session.username,
						'sentRequest.username': {$ne: req.body.receiverName}
					},
					{
						$push: {sentRequest: {
						username: req.body.receiverName
						}}
						},(err, count) => {
						callback(err, count);
						})
			}
		}],
	(err, results)=>{
		res.redirect('/profile');
	});
   }
//    res.send('Receiver Name empty')
});


app.post('/accept/friend', (req, res)=>{
    console.log('in /friend')
   if(req.body.receiverName){
       console.log('server fr')
    user = req.session.user
    console.log(user)
    async.parallel([
		function(callback) {
			if(req.body.receiverName) {
                console.log('updataing....')
					User.updateOne({
						'username': req.body.receiverName,
						'request.userId': {$ne: user._id},
						'friendsList.friendId': {$ne: user._id}
					}, 
					{
						$push: {request: {
						userId: user._id,
						username: req.session.username
						}},
						$inc: {totalRequest: 1}
						},(err, count) =>  {
							console.log(err);
							callback(err, count);
						})
			}
		},
		function(callback) {
			if(req.body.receiverName){
					User.updateOne({
						'username': req.session.username,
						'sentRequest.username': {$ne: req.body.receiverName}
					},
					{
						$push: {sentRequest: {
						username: req.body.receiverName
						}}
						},(err, count) => {
						callback(err, count);
						})
			}
		}],
	(err, results)=>{
		res.redirect('/profile');
	});
   }
//    res.send('Receiver Name empty')
});

app.get('/newsfeed', (req, res)=>{
    console.log(req.session.username)
    if(req.session.username){
        var query = getPosts(req, res)
        // console.log(posts)
         query.exec((err, posts)=>{
            if(err){
                console.log(err)
            }else{
                console.log(posts)
                res.locals.posts = posts
                console.log(posts)
                return res.render('newsfeed', {posts: posts})
            }
        })
        return
    }
    return res.redirect('/')
})


app.post('/post', (req, res)=>{
    if(req.session.username){
        req.body.post['username'] = req.session.username
        var post = req.body.post
        var username = req.body.post['username']
        var title    = req.body.post['title']
        var body     = req.body.post['body']
        console.log(post)
        console.log(req.body.post['username'])
        const newPost = new Post({username, title, body})
          newPost.save()
          .then((post)=>{
            console.log("Post Success..!!")
            return }) 
          .catch((post)=>{
            console.log('Database Error')
            return})  
        return res.redirect('/newsfeed')
    }
    res.redirect('/')
})
app.post('/register', (req, res)=>{
    if(req.session.username == null){
        var user = {
            username    : req.body.username,
            email       : req.body.email,
            password    : req.body.password,
            confirm     : req.body.password2
        }
        const username = user.username
        const email    = user.email
        const password = user.password
        User.findOne({$or: [{email: user.email}, {username: user.username}]}, (err, user)=>{
            if(!err){
                if(user){
                    console.log("User Already Exists..!!")
                    return res.redirect('/')
                }else{ 
                    const newUser = new User({
                        username,
                        email,
                        password
                      })
                      newUser.save()
                      .then((user)=>{
                          var send = "<h3>Your Account Has been created at Meet and Greet....!!</h3>" + "<p>Email: " + user.email + "</p>" + "<p>Password: " + user.password + "</p>"
                          send = send + "<h1>Admin</h1>" + "<p>Pawan Kumar</p>" + "<p>Shaheryar Ali</p>" + "<br>" + "<span> Meet and Greet is a learnining based project</span>" 
                          var email = 'pk2432871@gmail.com';
                    var password = 'pawankumar123';
                    var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: email,
                      pass: password
                    }
                  });
                  var mailOptions = {
                    from: 'MAG <admin@gmail.com>',
                    to: user.email,
                    subject: 'Account Created Successfully...',
                    html: send
                  };
                  
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                      return;
                    } else {
                      console.log('Email sent: ' + info.response);
                      return;
                    }
                  });  
                        console.log("User Registered Successfully..!!")
                        return res.redirect('/')})
                      .catch((user)=>{
                        console.log('Database Error')
                        return res.redirect('/NotFound')})  
                }
            }else {
                return res.redirect('/NotFound')
            }
        })
        return
    }
    return res.render('index', {user: res.locals.user})
})
app.get('/logout', (req, res)=>{
    if(req.session.username){
        req.session.destroy()
        return res.redirect('/')
    }
    res.redirect('/')
})
app.get('/search', (req, res)=>{
    if(req.session.username){
        name = req.query.name
        // console.log(name[0])
        User.find({'username': new RegExp('^' + name)}, (err, user)=>{
            if(!err){
                if(user){
                    return res.send(user)
                }else{
                    return res.send(name)
                }
                
            }else{
                return res.redirect('/NotFound')
            }
        })
        return
    }
    res.redirect('/')

})

app.get('/profile', (req, res) =>{
    if(req.session.username){
        var user = req.session.username
        User.findOne({username: user}, (err, user) =>{
            if(!err){
                if(user){
                    return res.render("profile", {userData: user})
                }
                return
            }
            return res.redirect('/NotFound')
        })
        return
    }
})

app.get('/profile/edit', (req, res) => {
    if(req.session.username){
        var user = req.session.username
        User.findOne({username: user}, (err, user) =>{
            if(!err){
                if(user){
                    return res.render("edit", {data: user})
                }
                return
            }
            return res.redirect('/NotFound')
        })
        return
    }
    res.redirect('/')
})


app.post('/profile', (req, res) =>{
    console.log(req.url)
    // var form = new formidable.IncomingForm();
    var form = new formidable.IncomingForm();
    console.log(form)
    form.parse(req, function (err, fields, files) {
      if(!err){
        //   console.log(fields)
        //   console.log(files.userimg)
          var oldpath = files.userimg.path;
          var newpath = './public/upload/images/' + req.session.username + files.userimg.name;
          var img = req.session.username + files.userimg.name;
        fs.rename(oldpath, newpath, function (err) {
            if(err){
                throw err
            }else{
                var myquery = { username: req.session.username };
                var newvalues = { $set: {userImage: img } };
                User.updateOne(myquery, newvalues, function(err, res) {
                    if (err) throw err;
                    console.log("1 document updated")
                })
                return res.redirect('/profile')
            }
        })
        return
      }
      return  
    //   res.send("Error")
    })
    return 
})

app.post('/follow', (req, res)=>{
    if(req.session.username){
        console.log(req.body.followto)
        user1 = req.session.username
        user2 = req.body.followto
        User.find({
            'username': { $in: [
                user1,
                user2
            ]}
        }, (err, data)=>{
                 var conditions = {
                        _id: data[0]._id,
                        'following.username': { $ne: user2 }
                    };
                    
                    var update = {
                        $addToSet: { following: { userId: data[1]._id, username: user2 } }
                    }
                    
                    User.updateOne(conditions, update, (err,result2)=>{
                        console.log(result2)
                        var send = "<h2>A user!!</h3>" + "<p>Contact: " + data[0].email + "</p>" 
                          send = send + "<h1>Auto Email Generated By</h1>" + "<p>Meet and Greet...</p>" + "<br>" + "<span> Meet and Greet is a learnining based project</span>" 
                          var email = 'pk2432871@gmail.com';
                          var password = 'pawankumar123';
                          var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: email,
                      pass: password
                    }
                  });
                  var mailOptions = {
                    from: 'MAG <admin@gmail.com>',
                    to: data[1].email,
                    subject: user1 + ' follow you on MAG',
                    html: send
                  };
                  
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                      return;
                    } else {
                      console.log('Email sent: ' + info.response);
                      return;
                    }
                  });  
                        res.end()
                    });
            // console.log(data[1])
           res.end()
        });
        
    }
})
function changedb(user){
    User.findOne({username: user}, (err, result)=>{
        // console.log(user)
        var conditions = {
            _id: result._id,
            'following.username': { $eq: user }
        };
        
        var update = {
            $unset: { following: { userId: result._id, username: user } }
        }
        
        User.updateOne(conditions, update, (err,result2)=>{
            console.log(result2)
        });
    }) 
}
function addDb(user1, user2){
    User.find({
        'username': {
            $in: {
                user1,
                user2
            }
        }
    }, (err, result)=>{
        var conditions = {
            _id: result[0]._id,
            'following.username': { $eq: user2 }
        };
        
        var update = {
            $unset: { follower: { userId: result[1]._id, username: user2 } }
        }
        
        User.updateOne(conditions, update, (err,result2)=>{
            console.log(result2)
        });
    }) 
}

app.post('/like', (req, res)=>{
    console.log('in post')
    if(req.session.username){
     if(req.body.from){
         var user = req.body.from
         var postid = req.body.id
         var query = getUserId(req, res, req.session.username)
         query.exec((err, data)=>{
            var conditions = {
                _id: postid,
                'likes.username': {$ne: req.session.username}
            };
            
            var update = {
                $addToSet: { likes: { userId: data._id, username: req.session.username }},
            }
            
            User.updateOne(conditions, update, (err,result2)=>{
                console.log(result2)
                res.send(data)
            });  
         })
     }   
    }
})
function getUserId(req, res, user){
    
    var query = User.findOne({username: user})
    // query.exec((err, result)=>{
    //     console.log(result._id)
    //     return result._id
    // })
    return query
}

server.listen(port, ()=>{
    console.log(`Server Running on Port: ${port}`)  
})    