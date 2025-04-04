import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // send email to user
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Verify your demo account",
      text: `Welcome to DemoAccount .Your account has been created with email id : ${email}`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
/// login user
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    const user = await userModel.findOne({ email }); // find the user by email
    if (!user) {
      return res.json({ success: false, message: "invalid email" });
    }
    const isMatch = await bcrypt.compare(password, user.password); // compare the password with the hashed password
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    }); // create a token for the user

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // set cookie options
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// logout user
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }); // clear the cookie
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "User already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // generate 6 digit otp

    user.verifyOtp = otp; // set the otp in the user model
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 1000; // set the otp expire time to 24 hours
    await user.save(); // save the user model

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify your demo account",
      text: `Your verification OTP is ${otp}`, // send the otp to the user email
    };
    await transporter.sendMail(mailOptions); // send the email
    res.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const verifyEmail = async (req, res) => {
   const { userId, otp } = req.body; // get the userId and otp from the request body

   if(!userId || !otp) {
     return res.json({ success: false, message: "Missing details" });
   }
   try{

    const  user = await userModel.findById(userId); // find the user by userId

    if(!user){
      return res.json({ success: false, message: "User not found" });
    }

    if(user.verifyOtp === '' || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if(user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }
    user.isAccountVerified = true; // set the user as verified
    user.verifyOtp = ''; // clear the otp
    user.verifyOtpExpireAt = 0; // clear the otp expire time
    await user.save(); // save the user model
    return res.json({ success: true, message: "User verified successfully" });

   }catch(err) {
     return res.json({ success: false, message: err.message });
   }

}
