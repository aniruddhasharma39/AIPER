const mongoose = require('mongoose');
const Job = require('./backend/models/Job');
const TestInstance = require('./backend/models/TestInstance');
mongoose.connect('mongodb://localhost:27017/foodlab', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
  const job = await Job.findOne({ jobCode: '2605081100' });
  console.log('JOB:', JSON.stringify(job, null, 2));
  if (job) {
    const instances = await TestInstance.find({ jobId: job._id });
    console.log('INSTANCES:', JSON.stringify(instances, null, 2));
  }
  process.exit(0);
});
