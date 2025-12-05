import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireRole }) {
  const { token, user } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (requireRole && user && user.role !== requireRole && user.role !== "admin") {
    return <div className="p-6">Insufficient permissions</div>;
  }
  return children;
}
