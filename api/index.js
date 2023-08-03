const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const multer = require('multer');
const upploadMiddleWare = multer({dest:'uploads/'});
const fs = require('fs');


const app = express();


// 

const salt = bcrypt.genSaltSync(10);
const secret = "habdcjyejehac53535cdCDCDS";
// 
// middle ware
// credentials is set true so that we can send it 
app.use(cors({credentials:  true, origin: "http://localhost:3000"}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads',express.static(__dirname + '/uploads'));


// mongoose connection
 // const url = "" write ur own url
 mongoose 
 .connect(url)   
 .then(() => console.log("Database connected!"))
 .catch(err => console.log(err));
 
 



app.post("/register",async (req,res)=>{
    const {Username , password} = req.body;
    // res.json('test ok');
    
    try {
        const userDoc = await User.create({
            Username,
            password:bcrypt.hashSync(password,salt)
        });
        res.json(userDoc);
    
    } catch (error) {
        console.log(error);
        res.status(400).json(error);
        
    }
    
    // res.json({requestData: {Username,password}});
})


app.post('/login',async (req,res)=>{
    const {Username,password} = req.body;
    const  userDoc = await User.findOne({Username});
    const ok = bcrypt.compareSync(password,userDoc.password);
    // res.json(ok);
    if(ok){
        // logged in 
        jwt.sign({Username,id:userDoc._id} , secret   , (err,token)=>{
                if(err) throw err;
                res.cookie('token',token).json({
                    id:userDoc._id,
                    Username,
                });
        } );
    }
    else{
        res.status(400).json('Wrong Credentials')
    }
    
});


app.get('/profile',(req, res) => {
    const {token} = req.cookies;
    jwt.verify(token,secret,{},(err, info) => {
        if(err)throw err;
        res.json(info);
    });

    
});


app.post('/logout',(req, res) => {
    res.cookie('token','').json('ok');
})


// posts

app.post('/post',upploadMiddleWare.single('file') , async (req, res) => {
    const {originalname,path}= req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext
    fs.renameSync(path, newPath);
  
    const {token} = req.cookies;
    jwt.verify(token,secret,{},async(err, info) => {
        if(err)throw err;
        const {title ,summary , content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author:info.id
    
        });
        res.json(postDoc);
    });

    

    // res.json({ext});
    



})


app.get('/post',async(req, res) => {
        const posts =  await Post.find()
                                 .populate('author',['Username'])
                                 .sort({createdAt:-1})
                                 .limit(20);
        res.json(posts);
});



// creating separate page for the post 
app.get('/post/:id',async (req, res) => {
    const {id} = req.params;

    const postDoc = await Post.findById(id).populate('author',['Username']);
    res.json(postDoc);
})


app.put('/post',upploadMiddleWare.single('file'), async (req, res) => {
    let newPath = null;
    // res.json({test:4,fileIs:req.file});
    if(req.file){
        const {originalname,path}= req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path+'.'+ext
        fs.renameSync(path, newPath);
    }
    const {token} = req.cookies;
    jwt.verify(token,secret,{},async(err, info) => {
        if(err)throw err;
        const {id, title ,summary , content} = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        // res.json({isAuthor,postDoc,info});
        // res.json({isAuthor});

        if(!isAuthor){
           return res.status(400).json('You are not the author of this post');
            
        }
       await postDoc.update({
        title ,
        summary ,
        content,
        // if new path is there aka new oicture is there then insert it otherise use the previous one
        cover: newPath ? newPath : postDoc.cover,
    })
      res.json(postDoc);
    });

    




});




app.get('/user/:id', async (req, res) => {
    
    const {token} = req.cookies;
    jwt.verify(token,secret,{},async (err, info) => {
       
        if(err)throw err;
        res.json(info);
        
    });

   
  });
  
  
  


const port = 4000;
app.listen(port,()=>{
    console.log(`server running on port ${port}`);
});

