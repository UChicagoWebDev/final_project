// App.jsx

import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import LoginPage from './components/Login';
import UserHome from './components/UserHome';
import Profile from './components/Profile';
import CreateChannel from './components/CreateChannel';
import ChannelContent from './components/ChannelContent';

const App = () => {
  const [userLoggedIn, setUserLoggedIn] = useState(sessionStorage.getItem("user_id") != null);

  // handler for logged in or registered users
  function setLogin(userId) {
    setUserLoggedIn(true);
    sessionStorage.setItem("user_id", userId); // Set a real user id after login
  }

  useEffect(() => {
    // This effect runs once on mount to check if the user is logged in
    const loggedIn = sessionStorage.getItem("user_id") != null;
    setUserLoggedIn(loggedIn);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Routes that do not require login */}
        <Route path="/login" element={<LoginPage onLoginClick={setLogin} />} />
        <Route path="/" element={<Navigate replace to={userLoggedIn ? "/home" : "/login"} />} />

        {/* Protected routes that require login */}
        <Route path="/home" element={userLoggedIn ? <UserHome /> : <Navigate replace to="/login" />} />
        <Route path="/profile" element={userLoggedIn ? <Profile /> : <Navigate replace to="/login" />} />
        <Route path="/createChannel" element={userLoggedIn ? <CreateChannel /> : <Navigate replace to="/login" />} />
        <Route path="/channel/:channelId" element={userLoggedIn ? <ChannelContent /> : <Navigate replace to="/login" />} />
        <Route path="/channel/:channelId/message/:messageId" element={userLoggedIn ? <ChannelContent /> : <Navigate replace to="/login" />} />

        {/* Redirect all other paths to home if logged in, or login page if not */}
        <Route path="*" element={<Navigate replace to={userLoggedIn ? "/home" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default App;
