const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
        username:{
            type:String,
            required:[true, "Username Required"],
            trim:true,
            match:[/^[a-zA-Z0-9_]{3,20}$/,"Invlaid Syntax for UserName"]
        },
        email:{
            type:String,
            required:[true, "Email Required"],
            trim:true,
            unique:true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email"]
        },
        password:{
            type:String,
            required:[true, "Password Required"],
            trim:true,
            minLength:[1, "Password should be atleast 1 character long"]
        },
        DOB:{
            type:Date,
            required:[true, "DOB Required"]
        },
        favorites:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'Movie'
                
            }
        ]
    },
    {
        timestamps:true
    }
)

const User = mongoose.model("User", UserSchema, "User")
module.exports = User

