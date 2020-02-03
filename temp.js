const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
var session = require('express-session');
var indexRoutes  = require('./routes/indexRoutes'); 
const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
var checkFile = require('./file.js');
// var currentUser = null;
const nodemailer = require('nodemailer');

// checkFile();
// Initializing App
var app =  express();
// Set View Engine...
function test(){
   return;
}
// test();
app.set('view engine', 'ejs');
///Using Packages routes directories in project...
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));
const dbConnection = require('./dbconnection.js');
const createDatabase = require('./tables.js');
app.use(session(
    {
        secret: "Hello World",
        resave: false,
        saveUninitialized: false,
    }
));
// app.use(function(req, res, next){
//     req.locals.currentUser = req.user;
//     next();
// });
app.use(function(req, res, next){
    res.locals.currentUser = req.session.username;
    res.locals.admin       = req.session.adminName;
    res.locals.adminError = null;
    res.locals.userError = null;
    res.locals.errorDeleteBonds = null;
    res.locals.errorSellBonds = null;
    next();
});

const db = dbConnection();
// generateWinningTable();

// Routes

// app.get('/createDatabase', function(req, res){
//     createDatabase();
//     res.send("Table Created..!!");
// });
app.get('/', function(req, res){
    res.render('index', {title: 'Register', errors: null});
});

app.get('/login', function(req, res){
    res.render('login');
});

app.post('/login', function(req, res){
    email = req.body.email;
    password = req.body.password;
    console.log(email);
    var data;
    let sql = 'SELECT * FROM User Where Email = ? AND Password = ?';
    db.query(sql, [email, password], function(err, result, fields){
        // if(err){
        //     throw err;
        //     return res.redirect('/login');
        // }
        if(result.length > 0){
            data = result[0];
            console.log(data);
            req.session.email = email;
            req.session.username = data.username;
            console.log(req.session.username);
            currentUser = data.username;
            return res.redirect('/user');
        }
        res.locals.userError = "Database Error";
        return res.render('login');
        
    });
    return;
       
});
app.get('/forgot', function(req, res){
            res.render('forgot');
});

app.post('/forgot', function(req, res){
    userEmail = req.body.email;
    let sql = 'SELECT * From User Where Email = ? ';
    db.query(sql,userEmail, function(err, result, fields){
        if(result.length > 0){
            var send="<p>Email: " + userEmail + "</p>" + "<p>Password: " + result[0].Password + "</p>"; 
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
                from: 'PBS <pbs@gmail.com>',
                to: userEmail,
                subject: 'Forgot Password Notification',
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
            return res.redirect('/login');
        }
        return;
    });
});

app.get('/about', function(req, res){
    var data = [
        {
            name:"Pawan",
            age: "19",
        },
        {
            name: "Aditia",
            age: "14",
        },
        {
            name: "Sagar",
            age: "23",
        }
    ]; 
    res.render('about', {data: data}); 
    
});
app.get('/register', function(req, res){
    res.render('register', {title: 'Register', errors: null});
});
app.post('/register', [
    check('uname', 'Erro Occured in Username').trim().isLength({min: 4, max: 25}),
    check('fname', 'Erro Occured in Firstname').trim().isLength({min: 4, max: 25}),
    check('lname', 'Erro Occured in Lastname').trim().isLength({min: 4, max: 25}),
    check('password', 'Error Occured in Password').trim().isLength({min: 5, max: 30}),
    check('email','Error Occured in Email').trim().isEmail().normalizeEmail(),
    check('phone_no', 'Error Occured in Phone no').trim().isLength({min: 11, max: 11})
  ], function(req, res){
      console.log('In /register');
     var errors = validationResult(req);
        if(!errors.isEmpty()){
            console.log(errors.mapped());
            return res.render('Register', {title:"Register", errors: errors.mapped()});
        }else {
            const user = matchedData(req);
            // console.log(user);
            var userData = {};
            userData.username = user.uname;
            userData.First_Name = user.fname;
            userData.Last_Name = user.lname;
            userData.Password = user.password;
            userData.Email = user.email;
            userData.Phone_no = user.phone_no;
            console.log(userData);
            // res.send("Registerd...!!");
            let sql = 'INSERT INTO user SET ?';
            db.query(sql, userData, function(err, result){
                if(err){
                    throw err;
                }
                console.log(result);
                return res.redirect('/');
            }); 
            
        }
});
app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
});
app.get('/user', function(req, res){
    console.log("/user " + req.session.email);
    var userBonds,WinningBonds;
    if(req.session.email){
        let sql = 'SELECT bond_no,bond_type FROM user_bonds where username = ? ';
        db.query(sql, req.session.username, function(err, result){
            if(err){
                throw err;
            }
            // console.log(result);
            userBonds = result;
            console.log(userBonds);
            sql = 'SELECT user_bonds.bond_no, draw_list.prize_type FROM user_bonds, draw_list WHERE (user_bonds.bond_no = draw_list.bond_no) AND user_bonds.username = ? ';
            db.query(sql, req.session.username, function(err, matchedBonds){
                if(err){
                    throw err
                }
                winningBonds = matchedBonds;
                return res.render('user', {username: req.session.username, userBonds: userBonds, winningBonds: winningBonds});
            });
            return;
        });
        return;
    }
    res.redirect('/login');
});
app.get('/updateprofile', function(req, res){
    if(req.session.email){
        let sql = 'SELECT * FROM user where username = ? ';
        db.query(sql, [req.session.username], function(err, result){
            if(err){
                throw err;
            }
            var userData = result[0];
            console.log(userData);
            return res.render('updateprofile', {title: "Update", errors: null, userData: userData});
        });  
        return;
    }
    res.redirect('/user');
    
    
});
app.post('/updateprofile', [
    check('uname', 'Erro Occured in Username').trim().isLength({min: 4, max: 25}),
    check('fname', 'Erro Occured in Firstname').trim().isLength({min: 4, max: 25}),
    check('lname', 'Erro Occured in Lastname').trim().isLength({min: 4, max: 25}),
    check('password', 'Error Occured in Password').trim().isLength({min: 5, max: 30}),
    check('email','Error Occured in Email').trim().isEmail().normalizeEmail(),
    check('phone_no', 'Error Occured in Phone no').trim().isLength({min: 11, max: 11})
  ], function(req, res){
      if(req.session.email){
        console.log('In /update');
        var errors = validationResult(req);
        if(!errors.isEmpty()){
            console.log(errors.mapped());
            return res.render('updateprofile', {title:"Update", errors: errors.mapped()});
        }else {
            const user = matchedData(req);
            // console.log(user);
            var userData = {};
            userData.username = user.uname;
            userData.First_Name = user.fname;
            userData.Last_Name = user.lname;
            userData.Password = user.password;
            userData.Email = user.email;
            userData.Phone_no = user.phone_no;
            console.log(userData);
            // res.send("Registerd...!!");
            let sql = 'Update user SET ? where username = ? ';
            db.query(sql, [userData, userData.username], function(err, result){
                if(err){
                    throw err;
                }
                console.log(result);
                return res.redirect('/');
            });
            return;     
        }
        return;
      }
      res.redirect('/login');
});

app.get('/view/draws', function(req, res){
    if(req.session.admin){
        let sql = 'SELECT * FROM draw_list';
        db.query(sql, function(err, result){
            if(err){
                throw err;
            }
            var userData = [];
            var data = {
                bond_no: null,
                bond_type: null,
                opening_date: null,
                admin_id: null,
                prize_type: null
            }
            result.forEach(function(r){
                console.log(r);
                // console.log(r.opening_date.toLocaleString());
                var dat = r.opening_date.toLocaleString().split(' ');
                data.bond_no = r.bond_no;
                data.bond_type = r.bond_type;
                data.opening_date = dat[0];
                console.log(data.opening_date);
                data.admin_id = r.admin_id;
                data.prize_type = r.prize_type;
                userData.push(data);
            })
            return res.render('viewDraws', {data: userData});
        });
        return;
    }
    res.redirect('/admin/login');
});

app.get('/admin/users', function(req, res){
    res.send("all users table");
});

app.post('/admin/user', function(req, res){
    res.send("delete route");
});

app.get('/notification', function(req, res){
    if(req.session.email){
        let sql = 'SELECT user_bonds.bond_no, draw_list.prize_type, draw_list.opening_date FROM user_bonds, draw_list WHERE (user_bonds.bond_no = draw_list.bond_no) AND user_bonds.username = ? ';
            db.query(sql, req.session.username, function(err, matchedBonds, fields){
                if(err){
                    throw err
                }
                var send;
                if(matchedBonds.length > 0){
                    send = "<p>Here are the bond numbers and prizes you have won with date.....</p><table><thead><tr><th>Prize Bond</th><th>Prize Type</th><th>Opening Date</th></tr></thead><tbody>";
                matchedBonds.forEach(function(m){
                    var arr = m.opening_date.toLocaleString().split(' ');
                    var mid = "<tr><td>" + m.bond_no + "</td>" + "<td>" + m.prize_type + "</td>" + "<td>" + arr[0] + "</td>" + "</tr>";
                    send = send + mid;
                });
                var last = "</tr></tbody></table>";
                send = send + last + "<p>Thanks, Regards</p><p>Pawan Kumar (pawanluhana456@gmail.com)</p><p>Sanif Momin (sanif123@gmail.com)</p>";
                }
                else{
                    send = "<h1>Sorry You Have you Won Nothing Try Buying Latest Bonds and Retry Again...!!<h1><p>Thanks, Regards</p><p>Pawan Kumar (pawanluhana456@gmail.com)</p><p>Sanif Momin (sanif123@gmail.com)</p>";
                }
                console.log(send);
                
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
                    from: 'PBS <pbs@gmail.com>',
                    to: req.session.email,
                    subject: 'Prize Bond Notification',
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
                  var msg = "Email Sent to: " + req.session.email; 
                return res.render('notification', {username: req.session.username, send: msg});
            });
            return;
    }
    res.redirect('/login');
});
app.get('/user/:id/bonds/add', function(req, res){
    if(req.session.email){
        return res.render('AddBonds', {username: req.session.username});
    }
    res.redirect('/login');
});
app.post('/user/:id/bonds/add', function(req, res){
    if(req.session.email){
        console.log(req.body.bondtype);
        console.log(req.body.bondlist.toString());
        var bondlist= req.body.bondlist.toString().trim();
        // var bondlist = req.body.bondlist;
        array = bondlist.split(',');
        console.log(array);
        var data = {};
        let sql = 'INSERT INTO user_bonds SET ?';
        array.forEach(function(num){
            // num = num.split(' ').join('');
            data.bond_no = num;
            data.bond_type = req.body.bondtype;
            data.username = req.session.username;
            console.log(data);
            db.query(sql, data, function(err, result){
                if(err){
                    throw err;
                }
                console.log("added to db" + result[0]);
                return;
            });
            data = {};
            console.log(data);
            return;

        });
        return res.redirect('/user');
    }
    res.redirect('/login');
});
var userBonds = [{}];
app.get('/user/:id/bonds/delete', function(req, res){
    let data = [{}];
    if(req.session.email){
        let sql = 'SELECT * FROM user_bonds Where username = ? Order by bond_type asc';
        db.query(sql, [req.session.username], function(err, result){
                if(err){
                    throw err
                }
                
                // result.forEach(function(r){
                //     data.push(r);
                // });
                // data = JSON.stringify(result);
                data = result;
                // data.pop();
                // console.log(data);
                userBonds = data;
                console.log(data);
                // console.log(data["0"]["bond_no"]);
                return res.render('deleteBonds', {data: data, username: req.session.username});
                // return res.send('Help..'); 
            });
            return;      
        }
    return res.redirect('/login');
});
// app.get('/test', function(req, res){
//     res.render('updateprofile');
// });
app.post('/user/:id/bonds/delete', function(req, res){
    console.log(req.session.email);
    var bonds = [];
    if(req.session.email){
        console.log(req.body);
        if(req.body.checks != null){
            bonds = req.body.checks;
            let sql = 'DELETE FROM user_bonds where bond_no = ? ';
            bonds.forEach(function(bond){
                db.query(sql, [bond], function(err, result){
                    if(err){
                        throw err
                    }
                    console.log("Number of rows delete: " + result.affectedRows);
                    return;
                });
            });
            return res.redirect('/user');
        }
        return res.send('<h1>You Have Deleted NOTHING...!!!</h1><a href="/user" >Home</a>');
    }
    res.redirect('/login');
});
app.get('/user/:id/profile', function(req, res){
    res.send('user profile page');
});

app.get('/user/:id/bonds/sell', function(req, res){
    let data = [{}];
    if(req.session.email){
        let sql = 'SELECT * FROM user_bonds Where username = ? Order by bond_type asc';
        db.query(sql, [req.session.username], function(err, result){
                if(err){
                    throw err
                }
                data = result;
                console.log(data);
                return res.render('sellBonds', {data: data, username: req.session.username});
            });
            return;      
        }
    return res.redirect('/login');
});

app.post('/user/:id/bonds/sell', function(req, res){
    // console.log(req.session.email);
    var bonds = [];
    var buyer;
    if(req.session.email){
        // console.log(req.body);
        if((req.body.buyer!=req.session.username) && (req.body.checks != null) ){
            buyer = req.body.buyer;
            // console.log(buyer);
            buyer = buyer.toString();
            let sql = 'SELECT * FROM User WHERE username = ? ';
            db.query(sql, [buyer], function(err, result){ ///  CHECKING USERNAME
                if(err){
                   throw err
                }
                bonds = req.body.checks;
                var date = new Date();
                var arr = date.toLocaleString().split(' ');
                var soldData = {
                    sold_id: null,
                    Date_of_Purchase: arr[0],
                    seller_id: req.session.username,
                    bond_no: null,
                    buyer_id: buyer,
                }
                sql = 'SELECT sold_id FROM sold';
                var soldid = 0;
                db.query(sql, function(err, rows, fields){
                    if(err){
                        throw err;
                    }
                    else{
                        if(rows.length > 0){
                            soldid = rows.length;
                            return;
                        }
                    }
                    return;
                });
                bonds.forEach(function(bond){
                    console.log(soldData.buyer_id)
                    sql = 'Insert Into SOLD (sold_id, Date_of_Purchase, bond_no, seller_id, buyer_id) Values(?, ?, ? , ? , ?)';
                    soldData.bond_no = bond;
                    soldData.sold_id = soldid + 1;
                    db.query(sql, [soldData.sold_id, soldData.Date_of_Purchase, soldData.bond_no, soldData.seller_id, soldData.buyer_id], function(err, result){
                        if(err){
                            throw err
                        }
                        return;
                    });
                    soldid++;
                });
                bonds.forEach(function(bond){
                    console.log(soldData.buyer_id)
                    sql = 'UPDATE user_bonds SET username = ? WHERE bond_no = ? ';
                    db.query(sql, [soldData.buyer_id, bond], function(err, result){
                        if(err){
                            throw err
                        }
                        console.log('you sell your' + bond + 'to' + soldData.buyer_id);
                        return;
                    });
                });
                return;
            });
            return res.redirect('/user');
        }
        return res.send('<h1>You Have SOLD NOTHING...!!!</h1><a href="/user" >Home</a>');
    }
    return res.redirect('/login');
});

app.get('/admin', function(req, res){
    if(req.session.admin){
        let sql = 'SELECT * FROM user';
        db.query(sql, function(err, result){
            if(err){
                throw err;
            }
            return res.render('admin', {data: result});
        });
        return;
    }   
    res.redirect('/admin/login');
});

app.get('/admin/login', function(req, res){
    res.render('adminLogin');
});

app.post('/admin/login', function(req, res){
    var email = req.body.email;
    var password = req.body.password;
    console.log(password);
    let sql = 'SELECT * FROM admin WHERE Email = ? AND Password = ? ';
    db.query(sql, [email, password], function(err, result, fields){
        console.log(result.length);
        if(result.length > 0){
            req.session.admin = email;
            req.session.adminName = result[0].admin_id;
            req.session.adminPassword = result[0].Password;
            console.log(result[0].admin_id);
            return res.redirect('/admin');  
        }
        res.locals.adminError = "Database Error";
        return res.render('adminLogin');
    });
    return; 
});
app.get('/admin/logout', function(req, res){
    if(req.session.admin){
        req.session.destroy();
        return res.redirect('/admin');
    }
    res.redirect('/user');
});
app.get('/admin/draws/add', function(req, res){
    if(req.session.admin){
       return res.render('addDraws');
    }
    res.redirect('/admin/login');
    
});

app.post('/admin/draws/add', function(req, res){
    if(req.session.admin){
        // console.log(req.body.bondlist);
        console.log(arr);
        var arr = req.body.bondlist.split("\t").join("\n").split("\n");
        // console.log(arr);
        var b = [];
        arr.forEach(function(a){
            var str = a.toString();
            a = str.trim();
            if(a != '')
                b.push(a); 
        });
        // console.log(b);
        var data = {
            bond_no: null,
            bond_type: req.body.bondtype,
            opening_date: req.body.opening_date,
            admin_id: req.session.adminName,
            prize_type: req.body.prizetype, 
        }
        let sql = 'INSERT INTO draw_list SET ?';
        b.forEach(function(c){
            data.bond_no = c;
            // console.log(data);
            db.query(sql, [data], function(err, result){
                if(err){
                    throw err
                }
                return;
            });
           
        });
        return res.redirect('/admin');     
    }
    return res.redirect('/admin/login');
});

// app.get('/search/bonds', function(req, res){
//     res.render('search');
// });

app.get('/admin/send/notification', function(req, res){
    var receiver=null;
    if(req.session.admin){
        let sql = 'SELECT Email FROM USER';
        db.query(sql, function(err, result){
            if(err){
                throw err;
            }
            result.forEach(function(r){
                if(r.Email = 'k163965@nu.edu.pk')
                    receiver = r.Email; 
            });
            var msg= 'THis is a email from Prize bond SYSTem';
            var s = 'Your Winning LIST';
            var email = 'pk2432871@gmail.com';
            var password = 'pawankumar123';
            var numbers = [100,200,300,400];
            // var send = "<h1> You Have Won..!!</h1>";
            // numbers.forEach(function(n){
            //     send = send +"<p>"+ n + "</p>"
            // });
            var send = "<table><thead><tr><th>Prize Bond</th><th>Prize Type</th><th>Opening Date</th></tr></thead><tbody><tr><td>1000</td><td>Third</td><td>2017-03-15</td></tr></tbody></table>";
            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: email,
                pass: password
              }
            });
            
            var mailOptions = {
              from: 'Prize Bond System <pbs@gmail.com>',
              to: receiver,
              subject: 'Sending Email using Node.js',
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
            return;
        });
        return res.redirect('/admin');
    }
    return res.redirect('/admin/login');
});
// generateWinningTable();
function generateWinningTable(rq){
    let sql = 'SELECT DISTINCT username FROM user_bonds';
    db.query(sql, function(err, result){
        if(err){
            throw err;
        }
        // console.log(result);
        result.forEach(function(r){
            var user = r.username;
            // console.log(user);
            sql = 'SELECT user_bonds.bond_no,draw_list.prize_type, draw_list.opening_date FROM user_bonds, draw_list WHERE (user_bonds.bond_no = draw_list.bond_no) AND user_bonds.username= ? '
            db.query(sql, [user], function(err, rows, fields){
                if(err){
                    throw err;
                    return;
                }
                console.log(user);
                // console.log(fields);
                if(rows.length > 0);
                    console.log(rows);
                return;
            });
        });
        return;
    });
    return;
}
function notifyUsers(){
    let sql = 'SELECT DISTINCT username FROM user_bonds';
    db.query(sql, function(err, result){
        if(err){
            throw err;
        }
        // console.log(result);
        result.forEach(function(r){
            var user = r.username;
            // console.log(user);
            sql = 'SELECT user_bonds.bond_no,draw_list.prize_type, draw_list.opening_date FROM user_bonds, draw_list WHERE (user_bonds.bond_no = draw_list.bond_no) AND user_bonds.username= ? '
            db.query(sql, [user], function(err, rows, fields){
                if(err){
                    throw err;
                    return;
                }
                console.log(user);
                // console.log(fields);
                if(rows.length > 0);
                    console.log(rows);
                return;
            });
        });
        return;
    });
    return;
}
app.listen('3001',function(){
    console.log('sever is Running..!!');
});