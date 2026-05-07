const axios = require('axios');
const mongoose = require('mongoose');

async function test() {
  try {
    // 1. Get a head user token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'head1@aiper.com', // Need to know a valid head email
      password: 'head1password' // Need to know a valid head password
    });
    const token = loginRes.data.token;
    console.log("Logged in");
  } catch (e) {
    console.log("Login failed", e.response?.data || e.message);
  }
}
test();
