// NavBar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/navBar.css'; 

function NavBar({ username }) {
    const navigate = useNavigate();

    function handleHome(event) {
        navigate('/home'); 
    }

    function handleProfile(event) {
        navigate('/profile'); 
    }

    function handleChannel(event) {
        navigate('/createChannel'); 
    }

    function handleLogout(event) {
        sessionStorage.clear();
        navigate('/login'); 
    }

    return (
        <nav className="navbar">
            <div className="nav-brand">Welcome to Belay</div>
            <div className="nav-items">
                <button className="nav-link" onClick={handleHome}>Home</button>
                <button className="nav-link" onClick={handleProfile}>Profile</button>
                <button className="nav-link" onClick={handleChannel}>Create Channel</button>
                <button className="nav-link" onClick={handleLogout}>Logout</button>
            </div>
            <div className="nav-user">
                <button className="username-button" onClick={handleProfile}>{username}</button>
            </div>
        </nav>
    );
}

export default NavBar;
