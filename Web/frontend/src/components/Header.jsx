import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // Check for token to determine login status

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/login'); // Redirect to login page
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-white">
          School Portal
        </Link>
        <nav className="space-x-4">
          {token ? (
            // Show these links when user is logged in
            <>
              <Link to="/dashboard" className="hover:underline text-white">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hover:underline text-white bg-red-500 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            // Show these links when user is not logged in
            <>
              <Link to="/signup" className="hover:underline text-white">
                Sign Up
              </Link>
              <Link to="/login" className="hover:underline text-white">
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;