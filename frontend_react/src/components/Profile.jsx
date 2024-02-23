import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
// import '../styles/userHome.css'; 

function UserHome() {
    const username = sessionStorage.getItem("username"); 

    return (
        <div className="profile-container">
          <NavBar username={username} /> 
          <h1>This is the Profile</h1>
        </div>
      );
}

export default UserHome;
