const { required } = require('joi')
const mongoose = require('mongoose')

const OTPSchema = mongoose.Schema(
    {
        email:{
            type:String,
            required:[true, "Email Required"]
        },
        otp:{
            type:String,
            required:true,
            match:[/^[0-9]{6}$/, "OTP Must be 6 digits long"]
        },
        expiresAt:{
            type:Date,
            required:true
        },
        purpose:{
            type:String,
            enum:[
                "forgot-password",
                "sign-up"
            ],
            required:true
        },
        isVerified:{
            type:Boolean,
            default:false
        },
        isUsed:{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps:true
    }
)

// Auto Delete of expiresAt Field
OTPSchema.index({expiresAt : 1}, {expireAfterSeconds:0});

// Fast Indexing
OTPSchema.index({email:1, purpose:1});

OTPSchema.methods.isValid = function(){
    if (this.isUsed == true || this.expiresAt < new Date()){
        return false
    }
    else{
        return true
    }
}


const OTP = mongoose.model("OTP", OTPSchema, "OTP")
module.exports = OTP


