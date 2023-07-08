const dbConnect=require('../mongoose-connection')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
// Schema for users of app
const UserSchema = new dbConnect.Schema({
	name: {
		type: String,
        required:true,
	},
	email: {
		type: String,
        unique:true,
		required: true,
	},
    number:{
        type:String,
        unique: true
    },
    gender:{
        type:String,
        // default:'Unknown'
    },
    password:{
        type:String,
        required:true
    },
    userType:{
        type:String,
        required:true,
    },
	date:{
		type: Date,
		default: Date.now,
	},
    tokens: [
		{
			token: {
                type:String,
                required:true
            }
		}
	]
});

UserSchema.virtual('userInfo', //person is the name provided to consider the virtual fxn at populate()
{
	ref:"Course",  //model from where you'll populate 
	localField:'_id',//the  attribute on the model that once found, will populate.(Attribute should exist in the db/model)
    foreignField:'coursesEnrolled',//name of the field in the referenced model
	justOne:false // there can be multiple courses associated with a single user.
})
//TO generate a token
UserSchema.methods.generateAuthToken = async function(next) {
    //we did't use arrow fxn bcs it doesn't consider 'this'
        const user = this; //this=fxn caller = const user from routes where the fxn is called
        // console.log(user);
        // Checking for an existing token
        if(!user.tokens[0]){
            console.log('No tokens found. Creating one');
            //provide two parameters, a unique identifier(id here) and a secret key
           const token = jwt.sign({ _id: user._id.toString() }, 'thisismysecret'); //convert id to string first bcs it has an object's nature 
           //decoding the token to view
           const decoded=jwt.verify(token,'thisismysecret')
           //checking if decoded token id matches the user._id used for encoding
           if(user._id.toString()!==decoded._id){throw new Error('Decoded _id from token doesn\'nt match this user _id')}
           // console.log("decoded version: "+decoded._id);
           //setting the value of token from the userSchema to an object {token: token_value}
           user.tokens=user.tokens.concat({token}) //concat joins 2 arrays (user.tokens from userSchema & [{token:token}])
           await user.save() //save this token on this user data a
           return token;
        }
        // console.log('Token '+user.tokens[0]+' found.');
       return user.tokens[0].token
    //    next();
    };
//to check pass and email to login
UserSchema.statics.findByCredentials = async (email,pass) => {
	const user = await User.findOne({email}); //Fetch user from db having this email
	if (!user) {
		throw new Error('Wrong username or password'); //The email doesn't exist in db
	}
	//continuing here means the user has been found
	const match = await bcrypt.compare(pass, user.password); //compare entered password with the ecrypted one found in the db
	if (!match) {
		throw new Error('Wrong username or password');
	}
	return user; //give this as successful result output
};

//Before any object.save() function, run this (creating or updating)
UserSchema.pre('save', async function(next) {
	const user = this; //gives access to the user calling the save, form where the fxn is called
    //console.log(user);
	//checking if password has been changed in a request using this model
	if (user.isModified('password')) {
		//encrypt its value if the "pass" parameter was modified/created, so as to have a new ecrypted value, if modified
		user.password = await bcrypt.hash(user.password, 8); //8 is the recommended number of times to encrypt
	}
	//next(); //continue your operations
});
const User = dbConnect.model('users', UserSchema);
module.exports=User