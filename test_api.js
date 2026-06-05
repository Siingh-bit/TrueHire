

async function test() {
  console.log('1. Tracking page view...');
  let res = await fetch('http://localhost:3001/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'page_view', path: '/' })
  });
  console.log('Track Response:', await res.json());

  console.log('2. Tracking app download...');
  res = await fetch('http://localhost:3001/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'app_download', path: '/download' })
  });
  console.log('Track Response:', await res.json());

  console.log('3. Logging in as admin...');
  res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@truehire.com', password: 'password123', otp: '123456' }) // Admin might not require OTP locally if we bypass, or wait, it does!
  });
  let data = await res.json();
  console.log('Login:', data.message || 'Success');

  if (data.token) {
    console.log('4. Fetching admin dashboard...');
    res = await fetch('http://localhost:3001/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });
    console.log('Dashboard Data:', await res.json());
  } else {
    // We need to fetch OTP first
    console.log('Fetching OTP for admin...');
    res = await fetch('http://localhost:3001/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@truehire.com', type: 'login', password: 'password123' })
    });
    let otpData = await res.json();
    console.log('OTP:', otpData.devOtp);

    res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@truehire.com', password: 'password123', otp: otpData.devOtp })
    });
    data = await res.json();
    
    console.log('4. Fetching admin dashboard...');
    res = await fetch('http://localhost:3001/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });
    console.log('Dashboard Data:', await res.json());
  }
}

test();
