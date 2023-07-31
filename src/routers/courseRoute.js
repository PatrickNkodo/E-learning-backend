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
route.get('/courses', async (req, res) => {
    let courses;
    try {
        if (req.query.id) {
            courses = await Course.findOne({ _id: req.query.id })
        } else {
            courses = await Course.find().sort({ numberOfLessons: -1 })
        }
        await res.send(courses)
        console.log('courses successfull!');
    } catch (e) {
        res.send({ error: e.message })
    }
})
route.post('/addlesson', auth, async (req, res) => {
    try {
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
                    console.log('update successful');
                    return
                } else {
                    throw new Error("Exact Lesson title or content already exist in this same course")
                }
            }
            course.lessons = course.lessons.concat({ lessonTitle:req.body.lessonTitle, lessonNumber: course.lessons.length + 1, lessonContent: req.body.lessonContent,quiz:req.body.quizzData})
            course.numberOfLessons = course.lessons.length
            await course.save();
            await res.send({ success: 'Lesson created successfully' })
            console.log('addlesson saved successfully')
        } else { throw new Error('Id not found'); }
    } catch (e) {
        await res.send({ error: e.message })
        console.log('addlesson error:' + e.message)
    }
})
route.get('/nextlesson', auth, async (req, res) => {
    //lessonNumber:4 =>lessons[3], so recieving lessonNumber here will directly be used as the lesson[num]= lessonNumber:num+1 
    let _id = req.query.id;num=req.query.num
    const course = await Course.findOne({'lessons._id':_id})
    if (!course) { throw new Error('Course with this id not found') }
    const lesson = course.lessons[num]
    const lastNext=num==course.numberOfLessons-1
    console.log(lastNext,num,course.numberOfLessons);
    await res.send({ data: lesson,lastNext })
    console.log('nextlesson successful');
})

route.get('/prevlesson', auth, async (req, res) => {
    //change the num to num-2 because lessonNumber:5 =>lesson[4]
    //Going to lesson 4 then implies lessonNumber[num-2] to have lesson[3] = lessonNumber:4
    let _id = req.query.id;num=req.query.num
    const course = await Course.findOne({'lessons._id':_id})
    // console.log(_id+' is here',course.lessons);
    if (!course) { throw new Error('Course with this id not found') }
    const lesson = course.lessons[num-2]
    const lastPrev=num<3
    await res.send({ data: lesson,lastPrev })
    console.log('prevlesson successful',lastPrev);
})
route.get('/actuallesson', auth, async (req, res) => {
    let _id = req.query.id;num=req.query.num
    const course = await Course.findOne({_id })
    if (!course) { throw new Error('Course with this id not found') }
    let last;
    if(num<2){
        last='lastPrev'
    }else if(num==course.numberOfLessons){
        last='lastNext'
    }else{ last=false}
    await res.send({ data: course.lessons[num-1],last})
    console.log('actuallesson successful');
})
route.patch('/saveprogression', auth, async (req, res) => {
   try {
    let _id = req.query.id;num=parseInt(req.query.num);lessonIndex=parseInt(req.query.index)//cid=req.query.cid
    const saveprogress = await Course.findOne({lessons:{$elemMatch:{_id}},studentsEnrolled:{$elemMatch:{studentId:req.user._id}}});
    if (!saveprogress) { throw new Error('Couldn\'t save progress') }
    let dbLevel;
    saveprogress.studentsEnrolled=saveprogress.studentsEnrolled.map(x=>{
        if(x.studentId.toString()==req.user._id){
            dbLevel=x.level
            x.level+=1
        }
        return x
    })
    console.log('num',num,'index',lessonIndex,'db-level',dbLevel,'level==num-1==dblevel',lessonIndex+1==num && num==dbLevel,lessonIndex+1,num,dbLevel);
    let last;
    num<3?last='prev':num==saveprogress.numberOfLessons-1?last='next':false
    //level==num-1 && await saveprogress.save()
    await res.send({ data: saveprogress.lessons[num]})
    console.log('saveprogression successful');
   } catch (e) {
        res.send({error:'Error:'+e.message})
        console.log('Error:'+e.message);
   }
})
route.delete('/deletelesson', auth, async (req, res) => {
    // console.log(req.body);
    try {
        const course = await Course.findOne({ _id: req.body.id })
        if (course) {
            // Find the lesson to be deleted
            const lessonToDelete =await course.lessons.find(lesson => lesson._id == req.body.lessonId)
            if (!lessonToDelete) {
                throw new Error('Lesson not found')
            }

            // Remove the lesson from the lessons array
            course.lessons = await course.lessons.pull({ _id: req.body.lessonId })
            course.numberOfLessons = course.numberOfLessons - 1

            // Update the lessonNumber property of the remaining lessons
            course.lessons = course.lessons.map((lesson) => {

                // No need to change fields where lessonNumber < lessonToDelete.lessonNumber
                if (lesson.lessonNumber <= lessonToDelete.lessonNumber) {
                    return lesson
                }
                //  subtract 1 from the lessonNumber where lesson.lessonNumber>lessonToDelete.lessonNumber to update the indexes
                lesson.lessonNumber = lesson.lessonNumber - 1
                return lesson
            })
          let belowCoursesNumber = course.studentsEnrolled.filter(x => x.level >= lessonToDelete.lessonNumber);

course.studentsEnrolled = [
  ...course.studentsEnrolled.filter(x => x.level < lessonToDelete.lessonNumber), //include all items, which weren't in belowCoursesNumber
  ...belowCoursesNumber.map((each, i) => { //now include those which are too, to make the complete array
    let individualLesson = course.studentsEnrolled.filter(x => x.level === each.level);

    if (each.level === individualLesson[0].level) {
      console.log(each.level, 'index ' + i, individualLesson);
      return {...each, level: each.level - 1};
    }

    console.log('individualLesson for index ' + i + ' ' + individualLesson);
    return each;
  })
];  
            //belowCoursesNumber && console.log(belowCoursesNumber);
            console.log('numberOfLessons: '+Object.keys(course.lessons).length,'lessonToDelete '+lessonToDelete.lessonNumber,'studentLevel '+course.studentsEnrolled[0].level,'Number of lessons '+course.numberOfLessons);
            console.log(course.studentsEnrolled);

            await course.save()
            res.send({ success: 'Lesson deleted successfully!'})
            console.log('Deletion successful')
        } else {
            throw new Error('Course with _id not found')
        }
    } catch (e) {
        await res.send({ error: 'error: ' + e.message })
        console.log('error:' + e.message);
    }
})
route.post('/enroll', auth, async (req, res) => {
    try {
        let courseExists = await Course.findById({ _id: req.body.id }) //req.body._id
        if (courseExists) {
            const isEnrolled = courseExists.studentsEnrolled.some((student) => student.studentId.equals(req.user._id));
            if (isEnrolled) {
                throw new Error('Already enrolled')
            }
            courseExists.studentsEnrolled = courseExists.studentsEnrolled.concat({ studentId: req.user._id, level: 0 })
            await courseExists.save();
            await courseExists.populate({ path: 'studentsEnrolled.studentId', select: 'name email gender date' }) //call populate on a mongoose document because its a mongoose method
            res.send({ success: 'You sucessfully enrolled into ' + courseExists.title, studentId: req.user._id })
            console.log('enroll successfull');
        } else { throw new Error('Course not found here') }
    } catch (e) {
        res.send({ error: 'Error: ' + e.message })
        console.log(e);
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
                return course;
            });
            // let level=courses.studentsEnrolled[0].level
            // level=(level/courses.numberOfLessons)*100
            courses = courses.map(x => {
                let percentage = (x.studentsEnrolled[0].level / x.numberOfLessons) * 100
                percentage = parseFloat(percentage.toFixed(1))
                x = x.toObject()
                x = { ...x, percentage }
                return x
            })
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