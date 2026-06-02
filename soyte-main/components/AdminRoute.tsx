import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { isPathAllowed, getLandingPath } from "../utils/permissionUtils";

const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const currentPath = location.pathname;
  const userPermissions = user.permissions || [];

  // 1. If user has NO permissions at all, redirect to homepage
  if (userPermissions.length === 0) {
    return <Navigate to="/" replace />;
  }

  // 2. Handle the root admin path (/admin) by redirecting to the first allowed feature
  if (currentPath === "/admin" || currentPath === "/admin/") {
    const landingPath = getLandingPath(user);
    // If no landing path found, it will redirect back to the home page via getLandingPath returning "/"
    return <Navigate to={landingPath} replace />;
  }

  // 3. Check if the specific sub-path is allowed
  if (!isPathAllowed(currentPath, user)) {
    // If they are on a page they don't have permission for, 
    // redirect them to their primary landing page instead of the homepage.
    const landingPath = getLandingPath(user);
    return <Navigate to={landingPath} replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
