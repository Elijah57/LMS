const User = require('../../models/users/userModel');
const asyncHandler = require('express-async-handler')
const ejs = require("ejs");
const path = require('path')
const sendMail = require("../../utils/mails/mailer")
const validateEmail = require("../../utils/helpers/validateEmail")
require("dotenv").config()

const HOST = process.env.HOST;

const registerUser = asyncHandler ( async (req, res)=>{
    // Before user is registered check if email, has been created with another user before
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    // perform input data checks
    const isMailValid = validateEmail(email)
    if (isMailValid === null) return res.status(400).json({status: false, message: "Invalid email address"})
    
    if ((typeof(password) !== "string") || (password === null) )return res.status(400).json({message: "Password invalid"});
    if(password !== confirmPassword) return res.status(400).json({status: false, message: "Password does not match"})

    const userInput = {firstname, lastname, email, password};

    // check if email already exists
    const findUser = await User.findOne({email: email});

    // if user not found
    if(!findUser){
        const createdUser = await User.create(userInput);
        const userVerificationCode = await createdUser.createActivationToken();
        const userActivationLink = `${HOST}/api/verify-email/${userVerificationCode}`

        const data= {user: createdUser.firstname, userActivationLink}
        const html = await ejs.renderFile(path.join(__dirname, "../../mails/activation-mail.ejs"), data)
    
        try{
            await sendMail({
                email: createdUser.email,
                subject: "Activate Your Account",
                template: "activation-mail.ejs",
                data
            });
        }catch(error){
            return res.status(422).json({message: "Something went wrong!"})
        }
        res.status(200).json({
            status:true,
            message: "User Created Successfully",
            createdUser
        })
    }else{
        return res.status(400).json({
            status: false,
            message: "User with Email already Exists"
        })
    }
});

module.exports = registerUser;