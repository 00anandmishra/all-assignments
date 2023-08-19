const express = require('express');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];


const adminAuthenticator = (req,res,next) => {
  const { username , password } = req.headers;
  const admin = ADMINS.find(a => a.username === username && a.password === password);
  if(admin){
    next();
  }  
  else {
    res.status(403).json({ message: 'Authenticaton error'});
  }
}
const userAuthenticator = (req,res,next) => {
  const { username , password } = req.headers;
  const user = USERS.find(a => a.username === username && a.password === password);
  if(user){
    req.user = user;
    next();
  }  
  else {
    res.status(403).json({ message: 'Authenticaton error'});
  }
}
// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body;
  const adminExists = ADMINS.find(a => a.username === admin.username && a.password === admin.password );
  if(adminExists){
    res.status(403).json({ message: 'Admin already exists' });
  }
  else {
    ADMINS.push(admin);
    res.json({ message: 'Admin created successfully' });
  }
});

app.post('/admin/login', adminAuthenticator ,(req, res) => {
  // logic to log in admin
  res.json({ message: 'Logged in successfully' });
});

app.post('/admin/courses', adminAuthenticator,(req, res) => {
  // logic to create a course
  const course = req.body;
  course.id = new Date().valueOf();
  COURSES.push(course);
  res.json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', adminAuthenticator, (req, res) => {
  // logic to edit a course
  const id = parseInt(req.params.courseId);
  const course = COURSES.find( a => a.id === id);
  if(course) {
    Object.assign(course, req.body);
    res.status(200).json({ message: 'Course updated successfully' });
  }
  else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/admin/courses', adminAuthenticator, (req, res) => {
  // logic to get all courses
  res.json({ courses : COURSES})

});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = req.body;
  const userExists = USERS.find(a => a.username === user.username && a.password === user.password );
  if(userExists){
    res.status(403).json({ message: 'User already exists' });
  }
  else {
    user.purchasedCourses = []; 
    USERS.push(user);
    res.json({ message: 'User created successfully' });
  }
});

app.post('/users/login', userAuthenticator, (req, res) => {
  // logic to log in user
  res.json({ message: 'Logged in successfully' });
});

app.get('/users/courses', userAuthenticator, (req, res) => {
  // logic to list all courses
  res.json({ courses : COURSES})
});

app.post('/users/courses/:courseId', userAuthenticator, (req, res) => {
  // logic to purchase a course
  const course = COURSES.find(c => c.id === parseInt(req.params.courseId) && c.published);
  if(course){
    req.user.purchasedCourses.push(course.id);
    res.status(200).json({ message: 'Course purchased successfully' });
  }
  else {
    res.json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', userAuthenticator, (req, res) => {
  // logic to view purchased courses
  const courses = COURSES.filter(c => req.user.purchasedCourses.includes(c.id));
  res.json({ purchasedCourses: courses })
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
