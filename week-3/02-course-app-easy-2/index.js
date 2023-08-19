const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const privateKey = "haibRoS2cr32t";
const generateJWT = (user, role) => {
  return jwt.sign({username: user.username, role: role}, privateKey,{ expiresIn: "1h" });
}
const authorizationJWT = (req,res,next) => {
  let token = req.headers.authorization;
  if(token) {
    token = token.split(" ")[1];
    jwt.verify(token,privateKey, (err,user) => {
      if(err){
        res.sendStatus(403);
      }
      else {
        req.user = user;
        next();
      }
    })
  }
  else {
    res.sendStatus(401);
  }
  
}
// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body;
  const adminExists = ADMINS.find(a => a.username === admin.username);
  if(adminExists){
    res.status(403).json({ message: 'Admin already exists'})
  }
  else {
    const token = generateJWT(admin,"admin");
    ADMINS.push(admin);
    res.status(200).json({ message : 'Admin created successfully', token})
  }

});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  const admin = ADMINS.find(a => a.username === username && a.password === password);
  if(admin){
    const token = generateJWT(admin,"admin");
    res.status(200).json({ message : 'Logged in successfully', token})
  }
  else {
    res.status(403).json({ message: 'Admin does not exists'})
  }
});

app.post('/admin/courses', authorizationJWT, (req, res) => {
  // logic to create a course
  const course = req.body;
  course.id = new Date().valueOf();
  COURSES.push(course);
  res.json({ message: 'Course created successfully', courseId: course.id });
  
});

app.put('/admin/courses/:courseId', authorizationJWT, (req, res) => {
  // logic to edit a course
  const id = parseInt(req.params.courseId);
  const course = COURSES.find(a => a.id === id);
  if(course){
    Object.assign(course, req.body);
    res.status(200).json({ message: 'Course updated successfully'})
  }
  else {
    res.status(404).json({ message: 'Course not found'})
  }
});

app.get('/admin/courses', authorizationJWT ,(req, res) => {
  // logic to get all courses
  res.json({ courses : COURSES });
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = req.body;
  const userExists= USERS.find(a=> a.username === user.username && a.password === user.password);
  if(userExists){
    res.status(403).json({message: "User already exists"});
  }
  else{
    const token = generateJWT(user,"user");
    USERS.push(user);
    res.json({ message: "User created successfully" , token})
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const { username, password} = req.headers;
  const user = USERS.find(a=> a.username === username && a.password === password);
  if(!user){
    res.status(403).json({message:"User does not exists"});
  }
  else {
    const token = generateJWT(user,"user");
    res.status(200).json({ message: "Logged in successfully", token});
  }
});

app.get('/users/courses', authorizationJWT, (req, res) => {
  // logic to list all courses
  res.json({ courses : COURSES });
});

app.post('/users/courses/:courseId', authorizationJWT, (req, res) => {
  // logic to purchase a course
  const course = COURSES.find( a => a.id === parseInt(req.params.courseId))
  if(course){
    const user = USERS.find( a=> a.username === req.user.username);
    if(user){
      if(!user.purchasedCourses){
        user.purchasedCourses = [];
      }
    user.purchasedCourses.push(course);
    res.status(200).json({message: "Course purchased successfully"})
    }
  }
  else {
    res.json({ message: 'course not found'})
  }
});

app.get('/users/purchasedCourses', authorizationJWT, (req, res) => {
  // logic to view purchased courses
  const user = USERS.find(u=> u.username === req.user.username);
  if(user && user.purchasedCourses){
    res.json({ purchasedCourses: user.purchasedCourses });
  }
  else {
    res.json({ message: 'No courses purchased.'})
  }
  
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
