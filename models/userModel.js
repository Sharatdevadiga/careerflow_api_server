import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

// Get the number of salt rounds for bcrypt hashing from environment variables
const { SALT_ROUNDS } = process.env;

// Define the schema for the User model
const userSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, "A user must have an email."],
    validate: [validator.isEmail, "Please provide a valid email."],
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minLength: [8, "Password must be minimum 8 characters long"],
    maxLength: [15, "Password must be maximum of 15 characters long"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm the password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
    select: false,
  },

  type: {
    type: String,
    enum: {
      values: ["employee", "employer"],
      message: "User type must be either employer or employee",
    },
    default: "employee",
  },

  // User's first and last name (required for all users)
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  savedJobsId: {
    type: mongoose.Schema.ObjectId,
    ref: "SavedJobs",
    default: null,
  },
  appliedJobsId: {
    type: mongoose.Schema.ObjectId,
    ref: "AppliedJobs",
    default: null,
  },

  // employer -> Company and company job-list
  company: {
    type: String,
    required: [
      function () {
        return this.type === "employer";
      },
      "Company of an employer is required",
    ],
  },

  // companyJobsId: [{ type: mongoose.Schema.ObjectId, ref: "jobs" }],
});

// Virtual field to get full name
userSchema.virtual("fullName").get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || "";
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Pre-save middleware to hash the password before saving to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, Number(SALT_ROUNDS));
  this.passwordConfirm = undefined;
  next();
});

// Instance method to check if the provided password matches the stored password
userSchema.methods.checkPassword = async function (
  inputPassword,
  actualPassword
) {
  console.log('checkPassword method called:');
  console.log('Input password:', inputPassword);
  console.log('Stored hash:', actualPassword);
  
  const result = await bcrypt.compare(inputPassword, actualPassword);
  console.log('bcrypt.compare result:', result);
  
  return result;
};

// Create and export the User model using the userSchema
const User = mongoose.model("User", userSchema);
export default User;
