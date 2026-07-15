import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import { Login } from './pages/Login';
import { ProfileCompletion } from './pages/ProfileCompletion';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Events } from './pages/Events';
import { EventCreateEdit } from './pages/EventCreateEdit';
import { Attendance } from './pages/Attendance';
import { CheckIn } from './pages/CheckIn';
import { Tasks } from './pages/Tasks';
import { Certificates } from './pages/Certificates';

import { Register } from './pages/Register';

// Public pages
import { PublicRegister } from './pages/PublicRegister';
import { EditRegistration } from './pages/EditRegistration';
import { SelfCheckIn } from './pages/SelfCheckIn';

// Layout
import { DashboardLayout } from './components/DashboardLayout';

// Private Route Wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-medium text-sm">Verifying volunteer session...</p>
      </div>
    );
  }

  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Guest Routes (Authentication) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/complete-profile" element={<PrivateRoute><ProfileCompletion /></PrivateRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public Event Roster & Check-In Portal Routes */}
      <Route path="/events/:slug/register" element={<PublicRegister />} />
      <Route path="/events/:slug/checkin" element={<SelfCheckIn />} />
      <Route path="/edit-registration" element={<EditRegistration />} />

      {/* Authenticated Dashboard Scopes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Events />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/events/create"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <EventCreateEdit />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/events/:id"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <EventCreateEdit />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/events/:eventId/attendance"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Attendance />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/events/:eventId/scan"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <CheckIn />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/tasks"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Tasks />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/certificates"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Certificates />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Fallbacks */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
