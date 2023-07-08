const mongoose= require('mongoose');
const dbConnect=require('mongoose');
const courseSchema=new dbConnect.Schema({
    title:{type:String},
    description:{type:String},
    instructorName:{type:String},
    instructorEmail:{type:String},
    numberOfLessons:{type:Number,default:0},
    studentsEnrolled:[
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'users'
              },
              lessonNumber:{
                type:Number
            }
        },
    ],
    lessons:[
        {
            lessonTitle: {
                type: String
            },
            lessonContent:{
                type:String
            },
            lessonNumber:{
                type:Number
            }
        }
    ],
    date:{
		type: Date,
		default: Date.now,
	},
})
const Course=dbConnect.model('course',courseSchema);
module.exports=Course;