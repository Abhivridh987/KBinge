const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const express = require('express')
const path = require('path')
const router = express.Router()
const joi = require('joi')
const mongoose = require('mongoose')

//envs

const JWT_KEY = process.env.JWT_KEY || 'your_jwt_key'

//Models

const User = require('../models/user.model')
const OTP = require('../models/otp.model')

//Middleware

//JWT

const jwtAuthMiddleware = (req,res, next) =>{
    if(req.cookies && req.cookies.token)
    {
        const token = req.cookies.token;
        try{
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        }catch(err)
        {
            console.log('Invalid JWT Token');
            res.status(401).json({
                message: 'Invalid JWT Token',
                status:401,
                ok:false
            })
        }
    }
    else{
        console.log('JWT Token is missing in the request');
        res.status(401).json({
            message: 'JWT Token is missing in the request',
            status:401,
            ok:false
        })
    }
}

// JOI
const SignUpValidation = async (req,res,next) =>{
    const SignUpSchema = joi.object({
        username:joi.string().required(),
        email:joi.string().email().required(),
        password:joi.string().required(),
        DOB:joi.date().required(),
        otpId:joi.string().required().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
    })
    const {error} = SignUpSchema.validate(req.body)
    if(error)
    {
        return res.status(400).json({
            "message":"JOI: Invalid Sign Up Validation Schema",
            "status":400,
            "ok":false,
            "error":error
        })
    }
    else{
        const foundUser = await User.findOne({email:req.body.email})
        if(foundUser)
        {
            return res.status(400).json({
                "message":"JOI: Email ExistS",
                "status":404,
                "ok":false
            })
        }
        const foundOTP = await OTP.findOne({_id:req.body.otpId}) 
        if (!foundOTP)
        {
            return res.status(404).json({
                "message":"JOI: OTP Session Doesnt Exists",
                "status":404,
                "ok":false
            })
        }
        if(!foundOTP.isValid())
        {
            return res.status(400).json({
                "message":"JOI: OTP Session Invalid or Expired",
                "status":404,
                "ok":false
            })
        }
        if(!foundOTP.isValid())
        {
            return res.status(400).json({
                "message":"JOI: OTP Session Not Valid",
                "status":404,
                "ok":false
            })
        }
        next();
    }
}

const LoginInValidation = (req,res,next) =>{
    const LoginInSchema = joi.object({
        email:joi.string().email().required(),
        password:joi.string().required()
    })
    const {error} = LoginInSchema.validate(req.body)
    if(error)
    {
        return res.status(400).json({
            "message":"JOI: Invalid Login In Validation Schema",
            "status":404,
            "ok":false,
            "error":error
        })
    }
    else{
        next();
    }
}

const OTPSendingValidation = async (req, res, next) => {
    const OTPSendingSchema = joi.object({
        email: joi.string().email().required(),
        purpose: joi.string().valid('sign-up', 'forgot-password').required()
    });

    const { error } = OTPSendingSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            status: 400,
            ok: false,
            error: error
        });
    }

    const foundUser = await User.findOne({ email: req.body.email });

    // For sign-up: user should NOT exist
    if (req.body.purpose === 'sign-up' && foundUser) {
        return res.status(409).json({
            message: "User with this email already exists",
            status: 409,
            ok: false
        });
    }

    // For forgot-password: user MUST exist
    if (req.body.purpose === 'forgot-password' && !foundUser) {
        return res.status(404).json({
            message: "No account found with this email",
            status: 404,
            ok: false
        });
    }

    next();
};

const OTPVerificationValidation = async (req,res,next) => {
    const OTPVerificationSchema = joi.object({
        otpId:joi.string().required().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }),
        otp:joi.string().pattern(/^\d{6}$/).required()
    })
    const {error} = OTPVerificationSchema.validate(req.body)
    if(error)
    {
        return res.status(400).json({
            "message":"JOI: Invalid Sign Up Validation Schema",
            "status":400,
            "ok":false,
            "error":error
        })
    }
    else{
        const foundOTP = await OTP.findOne({_id:req.body.otpId}) 
        if (!foundOTP)
        {
            return res.status(404).json({
                "message":"JOI: OTP Session Doesnt Exists",
                "status":404,
                "ok":false
            })
        }
        // Check if OTP is valid (not expired, not used)
        if (!foundOTP.isValid()) {
            return res.status(400).json({
                message: "OTP has expired or already been used",
                status: 400,
                ok: false
            });
        }
        next();
    }
}

const ResetPasswordValidation = async (req,res,next)=>{
    const ResetPasswordSchema = joi.object({
        otpId:joi.string().required().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }),
        password:joi.string().required(),
        email:joi.string().email().required()
    })

    const {error} = ResetPasswordSchema.validate(req.body)
    if(error)
    {
        return res.status(400).json({
            "message":"JOI: Invalid Sign Up Validation Schema",
            "status":400,
            "ok":false,
            "error":error
        })
    }
    else{
        const foundOTP = await OTP.findOne({_id:req.body.otpId}) 
        if (!foundOTP)
        {
            return res.status(404).json({
                "message":"JOI: OTP Session Doesnt Exists",
                "status":404,
                "ok":false
            })
        }

        if (foundOTP.isValid() == false)
        {
            return res.status(404).json({
                "message":"JOI: OTP Session Not Valid",
                "status":404,
                "ok":false
            })
        }

        if (req.body.email != foundOTP.email)
        {
            return res.status(404).json({
                "message":"JOI: OTP Email doesnt verify user email",
                "status":404,
                "ok":false
            })
        }
        
        const foundUser = await User.findOne({email:req.body.email}) 
        if (!foundUser)
        {
            return res.status(404).json({
                "message":"JOI: User with this email Doesnt Exists",
                "status":404,
                "ok":false
            })
        }

        
        next();
    }
}
// Paths

const authControllerPath = path.join(__dirname, '..', 'controllers', 'authControllers.js')

// Controllers

const {
    userSignUp,
    userSignUpSendOTP,
    // userSignUpVerifyOTP,

    // userLoginIn,

    // userSendForgotOTP,
    // userVerifyForgotOTP,
    // userResetPassword,

    // currentUser,

    // changePassword,

    // userLogout

} = require(authControllerPath)

//Routes

router.get('/', (req,res)=>{
    return res.status(200).json({
        message:"KBinge Auth Root Reached",
        status:200,
        ok:true,
        origin:"Auth Root"
    })
})

//Sign Up Routes
router.post('/signup', SignUpValidation, userSignUp)
router.post('/sign-up/send-otp', OTPSendingValidation, userSignUpSendOTP)
// router.post('/sign-up/verify-otp', OTPVerificationValidation ,userSignUpVerifyOTP)


// //Forgot Password Routes
// router.post('/forgot-password/send-otp', OTPSendingValidation, userSendForgotOTP);
// router.post('/forgot-password/verify-otp', OTPVerificationValidation,userVerifyForgotOTP);
// router.put('/forgot-password/reset',ResetPasswordValidation , userResetPassword);

// //Login Routes
// router.post('/login',LoginInValidation, userLoginIn)

// //Current User
// router.get('/me', jwtAuthMiddleware, currentUser)

// //Change Password
// router.put('/change-password', jwtAuthMiddleware, changePassword)

// //Logout
// router.post('/logout', jwtAuthMiddleware, userLogout)

module.exports = router