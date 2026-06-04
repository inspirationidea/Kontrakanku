import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './context/useAuth';
import AppUpdateChecker from './components/AppUpdateChecker';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';

// Protected Route Wrapper for Authenticated Users
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Protected Route Wrapper for Administrators
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

// Layout wrapper for user-facing pages (with Navbar + Footer)
const UserLayout = ({ children }) => (
  <div className="app-container">
    <Navbar />
    <div style={styles.contentWrapper}>
      {children}
    </div>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <AppUpdateChecker />
        <Routes>
          {/* Admin Login — own layout, no Navbar */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard — own layout, no shared Navbar */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* All user-facing routes — shared Navbar */}
          <Route path="*" element={
            <UserLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/properties/:id" element={<PropertyDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Tenant Authenticated Routes */}
                <Route path="/booking" element={
                  <PrivateRoute>
                    <Booking />
                  </PrivateRoute>
                } />
                <Route path="/payment" element={
                  <PrivateRoute>
                    <Payment />
                  </PrivateRoute>
                } />
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </UserLayout>
          } />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

const styles = {
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(139, 92, 246, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default App;
