// App.jsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import LoginPage from './components/Login';
import UserHome from './components/UserHome';
import Profile from './components/Profile';
import CreateChannel from './components/CreateChannel';
import ChannelContent from './components/ChannelContent'; 

const App = () => {
  

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/createChannel" element={<CreateChannel />} />
        <Route path="/channel/:channelId" element={<ChannelContent />} />
        <Route path="/channel/:channelId/message/:messageId" element={<ChannelContent />} />
      </Routes>
    </Router>
  );
};

export default App;
