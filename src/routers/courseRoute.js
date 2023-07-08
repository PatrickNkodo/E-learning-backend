const express = require('express');
const Course = require('../models/course-model');
const auth = require('../middleware/auth');
const route = new express.Router()

//register
route.post("/addcourse", auth, async (req, res) => {
    try {
        if (!req.body.title || !req.body.description) { throw new Error("Unknown body keys") }
        const existence = await Course.findOne({ title: req.body.title, description: req.body.description })
        if (existence) {
            console.log(req.body.title + ' already existing');
            throw new Error('Course already existing')
        }
        else {
            let newCourse = await new Course({ ...req.body, instructorName: req.user.name, instructorEmail: req.user.email });
            //before this save, the pre save will be ran on the user model.
            let result = await newCourse.save()
            res.send({ success: result })
            console.log('successful');
        }
    } catch (e) {
        res.send({ error: e.message });
        console.log('addcourse:' + e.message);
    }
});
route.get('/mycreatedcourses', auth, async (req, res) => {
    try {
        const myCourses = await Course.find({ instructorEmail: req.user.email })
        if (myCourses) {
            await res.send({ data: myCourses })
            console.log('mycreatedcourses successful');
        }
    } catch (e) {
        await res.send({ error: e.message })
        console.log('mycreatedcourses error: ' + e.message);
    }
})
route.get('/courses', auth, async (req, res) => {
    let courses;
    try {
        if (req.query.id) {
            courses = await Course.findOne({ _id: req.query.id })
            courses.lessons.map(x => console.log(x.lessonTitle));
        } else {
            courses = await Course.find()
        }
        await res.send(courses)
        console.log('courses successfull!');
    } catch (e) {
        res.send({ error: e.message })
    }
})
route.post('/addlesson', auth, async (req, res) => {
    try {
        console.log(req.body);
        const course = await Course.findOne({ _id: req.body.id })
        if (course) {
            //some() is a js method to check it there's an element which satisfies the callback fxn
            const lessonExists = course.lessons.some((lesson) => lesson.lessonTitle === req.body.lessonTitle || lesson.lessonContent === req.body.lessonContent)
            if (lessonExists) {
                if (req.body.updating) {
                    course.lessons = course.lessons.map((lesson) => {
                        if (lesson.lessonTitle === req.body.lessonTitle || lesson.lessonContent === req.body.lessonContent) {
                            return {
                                ...lesson,
                                lessonTitle: req.body.lessonTitle,
                                lessonContent: req.body.lessonContent
                            };
                        } else {
                            return lesson;
                        }
                    });
                    await course.save();
                    await res.send({ success: 'Lesson updated successfully' });
                    return
                }else{
                    throw new Error("Exact Lesson title or content already exist in this same course")
                }
            }
            course.lessons = course.lessons.concat({ lessonTitle: req.body.lessonTitle, lessonNumber: course.lessons.length + 1, lessonContent: req.body.lessonContent })
            course.numberOfLessons = course.lessons.length
            // await course.save();
            await res.send({ success: 'Lesson created successfully' })
            console.log('addlesson saved successfully')
        } else { throw new Error('Id not found'); }
    } catch (e) {
        await res.send({ error: e.message })
        console.log('addlesson error:' + e.message)
    }
})
route.delete('/deletelesson', auth, async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.body.id })
        if (course) {
            course.lessons = await course.lessons.pull({ _id: req.body.lessonId })
            await course.save();
            await res.send({ success: 'Lesson deleted successfully!' })
            console.log('deleteletion successful');
        } else { throw new Error('Course with _id not found') }
    } catch (e) {
        await res.send({ error: 'error: ' + e.message })
        console.log('error:' + e.message);
    }
})
route.post('/enroll', auth, async (req, res) => {
    try {
        let courseExists = await Course.findById(req.body.courseId) //req.body._id
        if (courseExists) {
            const isEnrolled = courseExists.studentsEnrolled.some((student) => student.studentId.equals(req.user._id));
            if (isEnrolled) {
                throw new Error('Already enrolled')
            }
            courseExists.studentsEnrolled = courseExists.studentsEnrolled.concat({ studentId: req.user._id })
            await courseExists.save();
            await courseExists.populate({ path: 'studentsEnrolled.studentId', select: 'name email gender date' }) //call populate on a mongoose document because its a mongoose method
            res.status(200).send(courseExists.studentsEnrolled);
        } else { throw new Error('Course not found') }
    } catch (e) {
        res.send({ error: e.message })
    }
})
route.post('/unenroll', auth, async (req, res) => {
    try {
        let documentFound = await Course.findOne({ title: req.body.title, studentsEnrolled: { $elemMatch: { studentId: req.user._id } } }) //or 'studentsEnrolled.studentId':req.user._id//Find if a course has your id
        if (documentFound) {
            // Find the index of the student in the students array (You could also use a filter function)
            const studentIndex = documentFound.studentsEnrolled.findIndex((student) => {
                //console.log('data: ',student.studentId,req.user._id,typeof(student.studentId),typeof(req.user._id));
                return student.studentId.toString() == req.user._id.toString()
            });
            // If the student is found, remove them from the students array
            if (studentIndex !== -1) {
                //pull removes the item specified (in this case, the array object at index studentIndex)
                await documentFound.studentsEnrolled.pull(documentFound.studentsEnrolled[studentIndex]);
                //console.log(documentFound.constructor.name)
                console.log(typeof (documentFound.__v), documentFound.__v);
                await documentFound.save();
                res.status(200).send(documentFound);
            } else { throw new Error('Student not found') }
        } else { throw new Error('You\'re not enrolled in this course') }
    } catch (e) {
        res.send({ error: e.message })
        console.log(e);
    }
})

route.post('/instructordetails', auth, async (req, res) => {
    try {
        let instructor = await Course.findOne({ instructorName: req.body.instructor })
        if (instructor) {
            instructor = instructor.toObject();
            const keysToKeep = ['instructorName', 'description'];
            let instructorKeys = Object.keys(instructor)
            //reduce syntax: array.reduce(function(total, currentValue, currentIndex, arr), initialValue)
            //reduce's function takes a var to cummulate the data, and the current value to run the fxn.
            //Our initial value is an empty obj here, for data to cummulate in an object
            newObject = instructorKeys.reduce((createNewObject(cummulatedObject, instructorKey), {}))
            function createNewObject(sum, currentValue) {
                if (keysToKeep.includes(currentValue)) {
                    //this dynamically sets as key:value.
                    sum[currentValue] = instructor[currentValue]
                }
                return sum; //add it as the new array of elements; cummulatedObject
                //this wil iterate for all instructorKeys values
            }
            res.send(newObject);
        }
    } catch (e) {
        res.send({ error: e })
    }
})

route.get('/mycourses', auth, async (req, res) => {
    try {
        //find is an array while findOne is an object. So use map() to get specific fields
        let mycourses = await Course.find({ studentsEnrolled: { $elemMatch: { studentId: req.user._id } } })
        if (mycourses.length > 0) {
            let courses = mycourses.map(course => { //this is an array
                course.studentsEnrolled = course.studentsEnrolled.filter((x) => x.studentId == req.user._id.toString())
                //console.log(course.studentsEnrolled);
                return course;
            });
            return res.send({ data: courses });
        } else {
            res.send({ empty: "You've no course to which you're enrolled" })
            console.log("No courses yet");
        }
    } catch (e) {
        res.send({ error: e.message })
        console.log('Error: ' + e.message);
    }
})
module.exports = route
module.exports = route