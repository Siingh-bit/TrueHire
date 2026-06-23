
async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'password123' })
    });
    
    if (loginRes.status !== 200) {
      console.log('Login failed', await loginRes.text());
      return;
    }
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    
    console.log('Logged in successfully');

    // 2. Schedule Interview
    const res = await fetch('http://localhost:3001/api/interviews/schedule', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ job_id: '1', scheduled_at: '2026-06-26T10:06:00.000Z' })
    });
    const data = await res.json();
    console.log('Schedule Response:', data);

  } catch (e) {
    console.error('Fetch error:', e);
  }
}

test();
