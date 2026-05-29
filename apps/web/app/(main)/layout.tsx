import { AuthProvider } from '@/contexts/AuthContext';
import React from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default MainLayout;
