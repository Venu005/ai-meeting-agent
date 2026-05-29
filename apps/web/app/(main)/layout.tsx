import MainShell from '@/components/layout/MainShell';
import { AuthProvider } from '@/contexts/AuthContext';
import React from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <MainShell>{children}</MainShell>
    </AuthProvider>
  );
};

export default MainLayout;
