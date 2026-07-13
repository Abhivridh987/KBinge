const mongoose = require("mongoose");

const MovieSchema = mongoose.Schema(
{
    "Unnamed :0": {
        type: Number
    },
    "Name":{
        type:String,
        required:true,
        trim:true
    },
    "Year": {
        type: Number,
        required: true
    },

    "Genre": {
        type: String,
        trim: true
    },

    "Main Cast": {
        type: String,
        trim: true,
        default:''
    },

    "Sinopsis": {
        type: String,
        trim: true,
        default:''
    },

    "Score": {
        type: Number,
        min: 0,
        max: 10,
        required:true
    },

    "Content Rating": {
        type: String,
        trim: true,
        enum:[
            "15+ - Teens 15 or older",
            "13+ - Teens 13 or older",
            "18+ Restricted (violence & profanity)",
            "R - Restricted Screening (nudity & violence)",
            "G - All Age",
            "Not Yet Rated"
        ]
    },

    "Tags": {
        type: String,
        trim: true,
        default:''
    },

    "Network": {
        type: String,
        trim: true
    },

    "img url": {
        type: String,
        trim: true
    },

    "Episode": {
        type: String,
        trim: true
    }
},
{
    timestamps: true
}
);

const Movie = mongoose.model("Movie", MovieSchema, "Movie");

module.exports = Movie