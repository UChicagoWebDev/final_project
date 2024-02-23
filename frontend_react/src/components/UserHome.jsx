// UserHome.js
import React from 'react';
import NavBar from './NavBar';
import ChannelList from './ChannelList';
import '../styles/userHome.css';

function UserHome() {
  const username = sessionStorage.getItem("username");

  return (
    <div className="home-container">
      <NavBar username={username} />
      <div className="main-content">
        <ChannelList />
        <div className="channel-content">
          <h2>Channel Content: Choose a Channel</h2>
        </div>
        <div className="message-thread">
          <h3>Message Thread: Empty Message</h3>
        </div>
      </div>
    </div>
  );
}

export default UserHome;

