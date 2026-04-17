async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@foodlab.com', password: 'AdminPassword123!' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in, got token');

    const updateRes = await fetch('http://localhost:5000/api/users/69e25204ac019bec50fc42ac', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Anil Mehta Modified' })
    });
    console.log('Update status:', updateRes.status);
    console.log('Update body:', await updateRes.json());

    const deleteRes = await fetch('http://localhost:5000/api/users/69e25204ac019bec50fc42ac', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete status:', deleteRes.status);
    console.log('Delete body:', await deleteRes.json());
  } catch(err) {
    console.log('Fetch error:', err);
  }
}
test();
