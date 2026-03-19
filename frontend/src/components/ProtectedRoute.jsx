import { Navigate } from 'react-router-dom';

/**
 * Wraps authenticated routes. Redirects to /Login if:
 *  - No token in localStorage
 *  - Token is expired
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/Login" replace />;
  }

  // Check token expiry
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() > payload.exp * 1000) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return <Navigate to="/Login" replace />;
    }
  } catch {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return <Navigate to="/Login" replace />;
  }

  return children;
};

export default ProtectedRoute;
