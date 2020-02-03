const mongoose = require('mongoose')
      User     = require('./model/user.model')

db = {
  connect: function(){
    console.log('hello')
    mongoose.connect('mongodb://localhost:27017/cnpro',{ useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err))
    return

  },
  addUser: function(user){
    const {username, email, password, password2} = user
    // console.log(user.username)
    // return 
    const newUser = new User({
      username,
      email,
      password
    })
    console.log(newUser)
    newUser.save()
    .then((user) =>{console.log('User Registered..!!')})
    .catch((user)=>{console.log('User Not Registerd...!!')})
    return
  },
  getUser: function(user){
    console.log('getUser')
    const {username, email} = user
    isUser = User.findOne({email: email})
    .then((user)=>{ return true})
    .catch((user)=>{return false})
    console.log(isUser)
    return
  },
  users: ['Pawan', 'Aadi', 'Jake']
}
module.exports  = db