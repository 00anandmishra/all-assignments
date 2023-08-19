const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

app.use(express.json());

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

const adminSchema = new mongoose.Schema({
  username: {type: String , required: true},
  password: {type: String , required: true}
});

const courseSchema = new mongoose.Schema({
  title: {type: String , required: true},
  description: String,
  price: Number,
  imageLink: String,
  published: {type: Boolean, required: true}
});

const User = mongoose.model('User',userSchema);
const Admin = mongoose.model('Admin',adminSchema);
const Course = mongoose.model('Course',courseSchema);

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
let mongoURL = "mongodb+srv://anandmishra058:tpLZv0uFXPPlODil@cluster0.dlvzjxv.mongodb.net/Courses"; 
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Other options as needed
})
// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body;
  function callback(adminExists) {
    if(adminExists){
      res.status(403).json({ message: 'Admin already exists'})
    }
    else {
      const obj= {username: admin.username, password: admin.password};
      const newAdmin = new Admin(obj);
      newAdmin.save();
      const token = generateJWT(admin,"admin");
      res.status(200).json({ message : 'Admin created successfully', token})
    }
  }
  
  Admin.findOne({ username: admin.username}).then(callback);

});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  const admin = await Admin.findOne({ username, password});
  if(admin){
    const token = generateJWT(admin,"admin");
    res.status(200).json({ message : 'Logged in successfully', token})
  }
  else {
    res.status(403).json({ message: 'Admin does not exists'})
  }
});

app.post('/admin/courses', authorizationJWT, async (req, res) => {
  // logic to create a course
  const course = new Course(req.body);
  await course.save();
  res.json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', authorizationJWT, async (req, res) => {
  // logic to edit a course
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {new: true});
  if(course){
    res.json({ message: 'Course updated successfully'})
  }
  else {
    res.status(404).json({ message: 'Course not found'})
  }
});

app.get('/admin/courses', authorizationJWT , async (req, res) => {
  // logic to get all courses
  const courses = await Course.find({});
  res.json({ courses });
});

// User routes
app.post('/users/signup', async (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  const userExists= await User.findOne({ username });
  if(userExists){
    res.status(403).json({message: "User already exists"});
  }
  else{
    const newUser = new User({username, password});
    await newUser.save();
    const token = generateJWT(username,"user");
    res.json({ message: "User created successfully" , token})
  }
});

app.post('/users/login', async (req, res) => {
  // logic to log in user
  const { username, password} = req.headers;
  const user = await User.findOne({ username, password });
  if(!user){
    res.status(403).json({message:"User does not exists"});
  }
  else {
    const token = generateJWT(user,"user");
    res.status(200).json({ message: "Logged in successfully", token});
  }
});

app.get('/users/courses', authorizationJWT, async (req, res) => {
  // logic to list all courses
  const courses = await Course.find({ published: true });
  res.json({ courses });
});

app.post('/users/courses/:courseId', authorizationJWT, async (req, res) => {
  // logic to purchase a course
  const course = await Course.findById(req.params.courseId);
  if(course){
    const user = await User.findOne({username: req.user.username});
    if(user){
    user.purchasedCourses.push(course);
    await user.save();
    res.status(200).json({message: "Course purchased successfully"})
    } 
    else {
      res.status(403).json({ message: 'User not found' });
    }
  }
  else {
    res.json({ message: 'course not found'})
  }
});

app.get('/users/purchasedCourses', authorizationJWT, async (req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({username: req.user.username});
  if(user && user.purchasedCourses){
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  }
  else {
    res.json({ message: 'No courses purchased.'})
  }
  
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
