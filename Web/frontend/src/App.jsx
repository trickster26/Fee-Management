import { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import Login from './components/login/Login';
import Signup from './components/signup/Signup';
import Dashboard from './components/Dashboard'; // New import
import Header from './components/Header';

function App() {
  return (
    <GoogleOAuthProvider clientId="370002652735-vh43qh8fi4rrb0hrtepo908fphd5f683.apps.googleusercontent.com">
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} /> {/* New dashboard route */}
              <Route path="/" element={<Dashboard />} /> {/* Default to dashboard */}
              <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;