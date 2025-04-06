import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for JWT in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token, redirect to login
      navigate('/login');
      return;
    }

    // Optionally, verify token with backend (see Step 3)
    fetch('http://localhost:5000/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then((data) => setUser(data.user)) // Expecting { user: { id, fullName, email } }
      .catch((err) => {
        console.error(err);
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear session
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">School Portal Dashboard</h1>
        <button
          onClick={handleLogout}
          className="mt-2 bg-red-500 px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>
      </header> */}
      <main className="flex-grow p-8">
        <h2 className="text-xl font-semibold">Welcome, {user.fullName}!</h2>
        <p>Email: {user.email}</p>
        <p>User ID: {user.id}</p>
      </main>
    </div>
  );
};

export default Dashboard;