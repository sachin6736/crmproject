import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [auth, setAuth] = useState(null); // null = loading, true = authenticated, false = not

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://crmproject-mchb.onrender.com';
        const res = await fetch(`${apiUrl}/Auth/check`, {
          method: 'GET',
          credentials: 'include', // ✅ send cookies
        });

        if (res.ok) {
          const data = await res.json();
          console.log("User:", data.user); // optional: see decoded user (id, role, etc.)
          setAuth(true);
        } else {
          setAuth(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (auth === null) return <div>Loading...</div>;
  if (auth === false) return <Navigate to="/" />; // Assuming "/" is the login page

  return children;
};

export default ProtectedRoute;