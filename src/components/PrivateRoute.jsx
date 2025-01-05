// PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDoctorAuth } from '../context/DoctorAuthContext';

const PrivateRoute = ({ children }) => {
  const { doctor, loading } = useDoctorAuth();
  const location = useLocation();

  // Show loading state if auth is still being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not logged in, redirect to login page with the return url
  if (!doctor) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in, render the protected route
  return children;
};

export default PrivateRoute;