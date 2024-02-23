// ChannelList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/channelList.css';

function ChannelList() {
  const [channels, setChannels] = useState([]);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  let navigate = useNavigate();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/channels', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.Success) {
        setChannels(data.channels);
      } else {
        console.log('Display failed');
      }
    } catch (error) {
      console.error('Error during display channels:', error);
    }
  };

  const handleChannelClick = (channelId) => {
    navigate(`/channel/${channelId}`);
    setCurrentChannelId(channelId);
  };

  return (
    <div className="channel-list">
      {channels.map(channel => (
        <div
          key={channel.id}
          // Apply 'current-channel' class if this is the current channel
          className={`channel ${currentChannelId === channel.id ? 'current-channel' : ''}`} 
          onClick={() => handleChannelClick(channel.id)}
        >
          {channel.name}
        </div>
      ))}
    </div>
  );
}

export default ChannelList;
