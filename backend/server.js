const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/parameters', require('./routes/parameterRoutes'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
      // Drop legacy unique index on sampleSerial if it exists (allows retests to share serial)
      mongoose.connection.db.collection('jobs').dropIndex('sampleSerial_1').catch(() => {});
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
