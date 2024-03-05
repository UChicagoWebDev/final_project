// ChannelList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/channelList.css';

function ChannelList() {
  const [channels, setChannels] = useState([]);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  let navigate = useNavigate();
  const userid = sessionStorage.getItem("user_id");
  const [unreadMessageCounts, setUnreadMessageCounts] = useState({});

  useEffect(() => {
    fetchChannels();
    fetchUnreadMessageCounts();

    const intervalId = setInterval(fetchUnreadMessageCounts, 1000);
    return () => clearInterval(intervalId);
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

  const fetchUnreadMessageCounts = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/users/${userid}/unread_message_counts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.Success) {
        const counts = data.unread_message_counts.reduce((acc, curr) => {
          acc[curr.channel_id] = curr.unread_message_count;
          return acc;
        }, {});
        console.log("counts: ", counts);
        setUnreadMessageCounts(counts);
      } else {
        console.log('Failed to fetch unread message counts');
      }
    } catch (error) {
      console.error('Error during fetching unread message counts:', error);
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
          <span className="channel-name">{channel.name}</span>
          {/* <span className="unread-messages">
            {unreadMessageCounts[channel.id] ? ` ${unreadMessageCounts[channel.id]} unread` : ''}
          </span> */}
          {unreadMessageCounts[channel.id] > 0 && (
            <span className="unread-messages">
              {unreadMessageCounts[channel.id]} unread
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChannelList;
