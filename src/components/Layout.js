import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../Layout.css';

const Layout = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div className="search-bar">
             {/* Espace pour une future barre de recherche globale */}
          </div>
          <div className="user-profile">
            <div className="user-avatar">A</div>
            <span>Administrateur</span>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
