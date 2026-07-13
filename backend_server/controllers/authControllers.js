const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const path = require('path')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')

//Paths
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'

//Models
const User = require('../models/user.model')
const OTP = require('../models/otp.model')

const userSignUp = async (req, res) =>{
    const {username, email, password, DOB, otpId} = req.body

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    try{
        const deletedOTP = await OTP.deleteOne({_id:otpId})
        const newUser = new User({
            username:username,
            email:email,
            password:password,
            DOB:DOB,
            favorites:[]
        })
        try{
            const savedUser = await newUser.save()
            return res.status(201).json({
                message:'User signed up successfully',
                status:201,
                ok:true,
                user: savedUser
            })
        }catch(err){
            return res.status(500).json({
                message:"Error while saving new User",
                status:500,
                ok:false,
                error:err,
                origin:"userSignUp controller, Error in saving User"
            })
        }
    }catch(err){
        return res.status(500).json({
            message:"Error while saving new User",
            status:500,
            ok:false,
            error:err,
            origin:"userSignUp controller, Error in creating User"
        })
    }
    

}

const userSignUpSendOTP = async (req,res) =>{
    const {email, purpose} = req.body

    if (purpose != "sign-up"){
        return res.status(400).json({
            "message":"Invalid Purpose",
            status:400,
            ok:false,
            origin:"userSignUpController, Purpose Section"
        })
    }
    const generateOTP = () =>{
        return crypto.randomInt(100000, 999999).toString()
    }

    const OTPGenerated = generateOTP()
    const expiresMinutes = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
    try{
        await OTP.deleteMany({
            email:email, 
            purpose:purpose, 
            isUsed:false
        })
        const newOTP = new OTP({
            email:email,
            otp:OTPGenerated,
            expiresAt: expiresAt,
            purpose:purpose
        })
        try{

            const savedOTP = await newOTP.save()

            // send mail code
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            try{
                const info = await transporter.sendMail({
                    from: `"KBinge" <${process.env.EMAIL_USER}>`,
                    to:email,
                    subject:'Your OTP Code',
                    text:`Your OTP is ${OTPGenerated}, Valid for 10 minutes`,
                    html:`<div style="text-align: center;"><h2>Your OTP is: <b>${OTPGenerated}</b></h2></div>`,
                });
                console.log('Email sent:', info.messageId);
            }catch (err) {
                console.error('Error sending email:', err);
                return res.status(500).json({
                    message:"Error while sending OTP",
                    status:500,
                    ok:false,
                    error:err,
                    origin:"userSignUpSendOTP controller, Error in Sending OTP"
                })
            }

            return res.status(200).json({
                message:"OTP Send and Saved",
                status:200,
                ok:true,
                otpId: savedOTP._id,
                origin:"userSignUpSendOTP controller"
            })
        }catch(err){
            return res.status(500).json({
                message:"Error while saving new OTP",
                status:500,
                ok:false,
                error:err,
                origin:"userSignUpSendOTP controller, Error in saving OTP or Mail"
            })
        }
    }catch(err){
        return res.status(500).json({
            message:"Error while saving new OTP or Deleting OTPs",
            status:500,
            ok:false,
            error:err,
            origin:"userSignUpSendOTP controller, Error in creating OTP"
        })
    }

}

module.exports = {
    userSignUp,
    userSignUpSendOTP
}