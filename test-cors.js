const axios = require('axios');

async function testUserCreation() {
  try {
    console.log('Testing CORS and user creation endpoint...');
    
    const response = await axios.post('http://localhost:4002/users/create', {
      username: 'newuser' + Date.now(),
      email: 'newuser' + Date.now() + '@example.com',
      password: 'testpassword123',
      phone: '01234567890',
      role: 'USER'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4050'
      }
    });
    
    console.log('✅ Success! User created:', response.data);
    console.log('Response status:', response.status);
    console.log('CORS headers:', response.headers['access-control-allow-origin']);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    }
  }
}

testUserCreation();
