import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Profile preferences stored in DB
    reminderDays: {
      type: Number,
      default: 3,
    },
    myName: {
      type: String,
      default: '',
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    sortBy: {
      type: String,
      default: 'smart',
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
