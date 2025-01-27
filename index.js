require('dotenv').config()
const express = require('express')
const {PrismaClient} = require("@prisma/client");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient()

const app = express()

app.use(bodyParser.json());

// Parse incoming requests with urlencoded payloads
app.use(bodyParser.urlencoded({ extended: true }));

const verifyToken = async (req) =>{
    try {
        const token = req.header("token");
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified) {
            return verified
        } else {
            return null
        }
    } catch (error) {
        return null
    }
}


app.use( async (req, res, next) => {
    if(req.path.startsWith("/login") || req.path.startsWith("/register")){
        next()
    }else{
        
        const tokenPayload = await verifyToken(req)
        if(tokenPayload){
            next()
        }else{
            res.send("unautherized access !!", 401);
        }
       
    }
    next()
})


app.post('/register', async (req, res) => {
   try {
    const payload = req.body

    const exist = await prisma.user.findFirst({where: {
        email: payload.email
    }})

    if(exist){
        res.send("Email already exist", 452)
        return;
    }

    const result = await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: payload.password,
        }
    })
    res.send("User registered successfully !!", 200)
   } catch (error) {
    return res.send(error, "452");
   }
})

app.post('/login', async (req, res) => {
   try {
    const payload = req.body;

    const user = await prisma.user.findFirst({where:{
        email: payload.email
    }})

    if(user){
        if(user.password === payload.password){

            const token = jwt.sign({id: user.id, email: user.email}, process.env.JWT_SECRET);

            res.send({
                message: "login successfully",
                token: token,
            }, 200)
        }else{
            res.send({
                message: "Password is not correct",
            }, 402)
        }
    }
    else{
        res.send({
            message: "Email does not exist !!",
        }, 402)
    }

   } catch (error) {
    return res.send(error, "452");
   }
})


app.post('/updateProfile', async (req, res) => {
    try {
     const payload = req.body
    //  const token = req.header("token");


     const tokenPayload = await verifyToken(req)

     const result = await prisma.user.update({
        where: {
            id: tokenPayload.id
        },
         data: {
             name: payload.name,
             password: payload.password,
         }
     })
     res.send("Profile updated successfully !!", 200)

    } catch (error) {
     return res.send(error, "452");
    }
 })


 app.post('/createPost', async (req, res) => {
    try {
        const payload = req.body
        const tokenPayload = await verifyToken(req)

     const result = await prisma.posts.create({
        data: {
            slug: payload.slug,
             title: payload.title,
             body: payload.body,
             user_id: tokenPayload.id
        }
    })
   
    
    return  res.send("Post created successfully !!", 200)
    // res.set('Content-Type', 'application/json');
    // res.send('{"message": "Hello"}');
    // res.status(200).body({"message": "Hello"})


    } 
    catch (error) {
     return res.send(error, "452");
    }
 })


app.listen(process.env.PORT || 4000)