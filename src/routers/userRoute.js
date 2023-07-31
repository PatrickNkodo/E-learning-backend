const express = require('express');
const User = require('../models/user-model');
const auth = require('../middleware/auth');
const bcrypt=require('bcrypt')
const route = new express.Router()

//register
route.post("/signin", async (req, resp) => {
    try {
        let description="Hey! I'm "+req.body.name+", a"+req.body.userType+"."+ "contact me on\n"+req.body.email+'or by Phone number:'+req.body.number+'.'
        let user = new User({...req.body,description}); //we are setting the req.body in the react fxn
        const existence = await User.findOne({ email: user.email })
        if (existence) {
            resp.send({ error: 'Email already existing' })
        }
        else {
            //before this save, the pre save wukk be ran on the user model.
            let result = await user.save()
            console.log(user);
            user = user.toObject();
            delete user.password; //do not display the password
            return resp.send({user})
        }
    } catch (e) {
        console.log(e.message);
        resp.send({ error: e.message });
    }
});
route.post("/adminsignin", async (req, resp) => {
    try {
        let user = new User({ ...req.body, admin: true }); //we are setting the req.body in the react fxn
        const existence = await User.findOne({ email: user.email })
        if (existence) {
            resp.send({ error: 'Email already existing' })
        }
        else {
            let save = await user.save();
            save = user.toObject();
            delete save.password; //do not display the password
            resp.send(result)
        }
    } catch (e) {
        resp.send({ error: e.message });
    }
});

route.post('/login', async (req, res) => {
    try {
        let user = await User.findByCredentials(req.body.email, req.body.password)
        console.log(user.userType);
        if (user) {
            const token = await user.generateAuthToken()
            user = user.toObject() //convert to an object first
            delete user.password
            delete user.tokens
            res.send({ user, token })
        } else { throw new Error('No user found') }
    } catch (e) {
        res.send({ InvalidCredentials: e.message })
        console.log('Error:'+e.message);
    }
})

route.get('/users',auth, async (req, res) => {
    let users;
    console.log(req.query.email);
    try {
        if (req.query.email) {
            users = await User.findOne({ email: req.query.email })
        } else {
            users = await User.find({}).sort({name:1})
        }
        if(!users){throw new Error('No user found with this email')}
        await res.send(users)
        console.log('users successfull!',users);
    } catch (e) {
        res.send({ error: e.message })
    }
})
//profile
route.post('/profile', auth, (req, res) => {
    try {
        let user = req.user
        user = user.toObject()
        delete user.password
        res.send({ user })
        // console.log('profile',req.user.token);
    } catch (e) { res.send({ error: e.message }) }
})

route.patch('/update', auth, async (req, res) => {
    try {
        //get the fields to be updated
        const allKeys = Object.keys(req.body)
        const keys=allKeys.filter((x)=>x !='actualPassword' )
        const allowed = ['actualPassword','name', 'email', 'password', 'gender', 'number'] //Here are the allowed fields for update
        //check that the updating field is in the list of allowed updates (allowed). If there's no return value by the funcion, it returs false
        const validate = keys.every(validation)
        function validation(each) {
            return allowed.includes(each) //this returns a value (true) or nothing (false)
        }
        //the keys were't in the allowed keys
        if (!validate) {
           return res.send({error: 'Unfound key from collection' })
        }
       if(req.body.actualPassword){
        const isMatch = await bcrypt.compare(req.body.actualPassword, req.user.password)
        if (!isMatch) {
          // if the passwords don't match, send an error response
        //   return res.status(400).send({ error: 'Invalid current password' })
           res.send({error:'Invalid current password'})
           throw new Error('Invalid current password')
        }
       }
        //update the fields
        keys.forEach(each => {
            req.user[each] = req.body[each]
        })
        let user = req.user
        if (user.gender === '') { user.gender = 'Male' }
        await user.save()
        user = user.toObject()
        delete user.tokens
        delete user.password
        delete user.admin
        res.send({success:'Updated successfully'})
        console.log('Updated successfully')
        // console.log({user});
    } catch (e) {
        //res.send({error:e.message});
        console.log("Error:" + e.message);
    }
})
route.get('/everyone',auth,async(req,res)=>{
  try {
    let data=await User.find({})
    if(data){
        let newData=data.map(x=>{
            x=x.toObject()
            delete x.tokens
            delete x.password
            return x
        })
        res.send(newData)
    }else{throw new Error('No user')}
  } catch (e) {
    res.send({error:e.message})
  }
})
route.post('/logout', auth, async (req, res) => {
    try {
        res.send('Logged out successfully')
    } catch (e) {
        res.send({ error: e.message })
    }
})
route.delete('/deleteaccount', auth, async (req, res) => {
    try {
        if (req.user.admin == true) {
            await course.find({ _id: req.user._id }) //delete the hospital
        }
        await donate.find({ donator: req.user._id })
        await request.find({ requester: req.user._id })
        await User.findOneAndDelete({ _id: req.user._id })
        res.send({ deleted: req.user })
    } catch (e) {
        res.send({ error: e })
    }
})
module.exports = route;