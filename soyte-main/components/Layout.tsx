
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Danh sách các trang không hiển thị Header/Footer chung
  const isSpecialPage = 
    (location.pathname.startsWith('/admin') && !location.pathname.includes('/templates/qr/')) || 
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/confirm-password') ||
    location.pathname.startsWith('/change-password') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname === '/hanoi-system' ||
    location.pathname === '/emergency';

  return (
    <div className="flex flex-col min-h-screen">
      {!isSpecialPage && <Header />}
      
      <main className={`flex-grow ${isSpecialPage ? 'bg-gray-50' : ''}`}>
        {children}
      </main>
      
      {!isSpecialPage && <Footer />}
    </div>
  );
};

export default Layout;
