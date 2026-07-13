// Imports

//Basic Imports
const os = require('os')
const fs = require('fs')
const path = require('path')
const express = require('express') 
const cors = require('cors')

//Authentication Imports
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Server Imports
const app = express()

//API Documentation Imports
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./swagger/swagger')

// Database Imports
const mongoose = require('mongoose')

//Access Environment Variables
require('dotenv').config()

const PORT= Number(process.env.PORT) || 5050
const MONGO_URI=process.env.MONGO_URI
const JWT_SECRET=process.env.JWT_SECRET
// Paths

const authPath = path.join(__dirname, 'routes', 'authRouter.js')


// Middleware
const logData = (req,res,next) =>{
    console.log(`HTTPS REQUEST : ${req.method} ${req.headers.host}${req.url}`)
    next()
}

app.use(cors())
app.use(express.json())
app.use(cookieParser())

//Routes
const authRouter = require(authPath)

app.use('/auth', authRouter)




app.get('/', (req,res)=>{
    return res.status(200).json({
        message:"KBinge Server Root Running", 
        status:200,
        ok:true,
        origin:"App Root"
    })
})

//API Documentation


// Setting the Server

mongoose.connect(MONGO_URI)
.then(()=>{
    console.log(`Mongo DB Successfully Connected`)
    app.listen(PORT, ()=>{
        console.log(`Server is Running in PORT ${PORT}`)
    })
})
.catch((err)=>{
    console.log(`Error Occured while Cnnecting to Database : `)
    console.log(err)
})