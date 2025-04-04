import mongoose from "mongoose";


const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },

    verifyOTP:{
        type:String,
        required:true,
        default:""
    },
    verifyOTPExpires:{
        type:Number,
        required:true,
        default:0
    },

    isAccountVerified:{
        type:Boolean,
        default:false
    },
    resetOTP:{
        type:String,
        default:""
    },
    resetOTPExpires:{
        type:Number,
        default:0
    },


})

const userModel = mongoose.User || mongoose.model("User", userSchema); // Check if the model already exists to avoid recompilation
export default userModel;