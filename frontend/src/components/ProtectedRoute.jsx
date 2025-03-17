import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, authenticated }) => {
  if (!authenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 