const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();   // <-- important

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Debug: check env values loaded or not
console.log("📂 Loaded from .env:");
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("EMAIL_USER:", process.env.EMAIL_USER);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Define Mongoose schema
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /contact route
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Save to DB
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,  // apna Gmail use karein
      to: process.env.EMAIL_USER,
      replyTo: email,                // user ke email ko reply karne ke liye
      subject: `New Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: '✅ Message saved and email sent!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '❌ Failed to save or send', error });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
