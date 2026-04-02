const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be under 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [120, 'Brand name must be under 120 characters'],
      default: ''
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10,   'Message must be at least 10 characters'],
      maxlength: [2000, 'Message must be under 2000 characters']
    },
    ip: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
