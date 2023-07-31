const dbConnect=require('../mongoose-connection');
const mongoose = require('mongoose');
const answerOptionSchema = new mongoose.Schema({
    answerText: {
        type: String,
    },
    isCorrect: {
        type: Boolean,
    }
});

const quizQuestionSchema = new mongoose.Schema({
    questionText: {
        type: String,
    },
    answerOptions: {
        type: [answerOptionSchema],
    },
    correctAnswer: {
        type: Number,
    }
});

const courseSchema = new dbConnect.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    instructorName: {
        type: String,
        required: true
    },
    instructorEmail: {
        type: String,
        required: true
    },
    numberOfLessons: {
        type: Number,
        default: 0
    },
    studentsEnrolled: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'users'
            },
            level: {
                type: Number
            }
        }
    ],
    lessons: [
        {
            lessonTitle: {
                type: String
            },
            lessonContent: {
                type: String
            },
            lessonNumber: {
                type: Number
            },
            quiz: [
                {
                    type: quizQuestionSchema,
                    required: true
                }
            ],
        }
    ],
    date: {
        type: Date,
        default: Date.now,
    }
});

const Course = mongoose.model('course', courseSchema);
module.exports = Course;