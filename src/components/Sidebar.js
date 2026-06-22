import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Send, LogOut } from 'lucide-react';
import { logoutApi } from '../apiService';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutApi();
    navigate('/');
  };


  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        STIPE Assur
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          Tableau de bord
        </NavLink>
        <NavLink to="/adherents" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={20} />
          Adhérents
        </NavLink>
        <NavLink to="/bulletins" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <FileText size={20} />
          Bulletins de Soins
        </NavLink>
        <NavLink to="/bordereaux" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Send size={20} />
          Bordereaux d'envoi
        </NavLink>

        <button onClick={handleLogout} className="nav-item logout">
          <LogOut size={20} />
          Déconnexion
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
