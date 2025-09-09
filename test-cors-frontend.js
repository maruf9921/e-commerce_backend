const axios = require('axios');

// Test CORS with Origin from port 7000 (frontend port)
const testData = {
  username: 'testuser' + Date.now(),
  email: 'test' + Date.now() + '@example.com',
  password: 'password123',
  phone: '01234567890',
  role: 'USER'
};

axios.post('http://localhost:4002/users/create', testData, {
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:7000'  // Frontend port
  }
})
.then(response => {
  console.log('✅ CORS working from frontend port 7000!');
  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  console.log('User created:', response.data);
})
.catch(error => {
  console.log('❌ Error:', error.response?.data || error.message);
  if (error.response?.headers) {
    console.log('Response headers:', error.response.headers);
  }
});
