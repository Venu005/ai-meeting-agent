import React from 'react';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className='flex min-h-dvh items-center justify-center'>{children}</div>;
};

export default AuthLayout;
