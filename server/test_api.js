

const testFlow = async () => {
  const BASE_URL = 'http://localhost:3000/api/auth';
  let cookie = '';

  const request = async (endpoint, method = 'GET', body = null) => {
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': cookie
    };
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = await response.json();
    return { status: response.status, data };
  };

  console.log('--- Phase 01 Verification ---');

  // 1. Health check
  const health = await fetch('http://localhost:3000/api/health').then(r => r.json());
  console.log('1. Health Check:', health.status === 'ok' ? 'PASS' : 'FAIL');

  // 2. Signup Driver
  const signupRes = await request('/register', 'POST', {
    name: 'Test Driver',
    email: `driver_test_${Date.now()}@parkease.com`,
    password: 'password123'
  });
  console.log('2. Driver Signup:', signupRes.status === 201 && signupRes.data.user.role === 'DRIVER' ? 'PASS' : 'FAIL', signupRes.data);

  // 3. Login Admin (Provisioned earlier)
  const loginRes = await request('/login', 'POST', {
    email: 'admin@parkease.com',
    password: 'password123'
  });
  console.log('3. Admin Login:', loginRes.status === 200 && loginRes.data.user.role === 'ADMIN' ? 'PASS' : 'FAIL', loginRes.data);

  // 4. Me endpoint (Session restore)
  const meRes = await request('/me');
  console.log('4. Session Restore (Admin):', meRes.status === 200 && meRes.data.user.role === 'ADMIN' ? 'PASS' : 'FAIL');

  // 5. Logout
  await request('/logout', 'POST');
  
  // 6. Login Driver again to test restricted API
  await request('/login', 'POST', {
    email: signupRes.data.user.email,
    password: 'password123'
  });

  console.log('Tests complete.');
};

testFlow().catch(console.error);
