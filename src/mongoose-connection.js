//This is the connection file
const dbConnect = require('mongoose');
try{
    dbConnect.connect('mongodb://127.0.0.1:27017/',{dbName:'e-learning', autoIndex:true}) //,usecreateindex:true,useNewUrlPasrser:true
    console.log('Connected to database');
}catch(e){
    console.log('Error: '+e);
}
module.exports=dbConnect
