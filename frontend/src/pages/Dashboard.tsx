import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { VolunteerDashboard } from './VolunteerDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <AdminDashboard />;
    case 'DEPARTMENT_ADMIN':
      return <ManagerDashboard />;
    case 'VOLUNTEER':
    default:
      return <VolunteerDashboard />;
  }
};
