import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    fullName:{
         type:String,
        required: true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique: true,
        lowercase: true
    },
    password:{
        type:String,
        required: true
    },
    role: {
        type:String,
        enum:['student', 'lecturer'],
        default:'student'
    },
studentId:{
    type:String,
    unique:true,
    sparse:true
},
department:{
    type:String,
},
profilePhoto:{
    type:String
},
//Firebase URL 
isVerified:{
    type:Boolean,
    default:false
},
},{timestamps:true});
//Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 12)
});
//compare password method
userSchema.methods.matchPassword=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}
export default mongoose.models.User || mongoose.model('User', userSchema);
