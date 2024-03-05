// MessageThread.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import '../styles/messageThread.css';

function MessageThread() {
  const navigate = useNavigate();
  const { channelId } = useParams(); 
  const [messages, setMessages] = useState([]); 
  const userid = sessionStorage.getItem("user_id");
  const username = sessionStorage.getItem("username");
  const apiKey = sessionStorage.getItem(`${username}_api_key`);

  
  useEffect(() => {
    fetchMessages();

    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, [channelId]); 


  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/channels/${channelId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log("data: ", data);
      if (data.Success) {
        setMessages(data.message);
        // Assuming the last message in the array has the highest ID
        const maxMessageId = data.message.reduce((maxId, message) => Math.max(maxId, message.id), 0);
        console.log("maxMessageId: ", maxMessageId);
        if (maxMessageId > 0) {
          markLastMessageAsSeen(maxMessageId);
        }
      } else {
        console.log('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  


  const handleMessageClick = (message) => {
    console.log("Clicked message:", message.content);
    navigate(`/channel/${channelId}/message/${message.id}`);
  };


  const reactionTrack = async (emoji, replyMessageId) => {
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/reactions/post`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          user_id: userid,
          message_id: replyMessageId,
          emoji: emoji
        }),
      });
      const data = await response.json();
      if (data.Success) {
        console.log("Reactions stored successfully: ", data.error);
      } else {
        console.log("Failed to save reactions")
      }
    } catch (error) {
      console.error('Error saving reactions: ', error);
    }
  };


  // for hovering emojis display user names
  const [tooltip, setTooltip] = useState({ visible: false, users: [], position: { x: 0, y: 0 } });

  const fetchReactionUsers = async (emoji, messageId, event) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/reactions/${messageId}/${encodeURIComponent(emoji)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.Success) {
        setTooltip({
          visible: true,
          users: data.users,
          position: { x: event.clientX, y: event.clientY }
        });
      } else {
        console.log("Failed to fetch users for reaction");
      }
    } catch (error) {
      console.error('Error fetching users for reaction: ', error);
    }
  };
  
  const Tooltip = ({ users, position }) => {
    return (
      <div style={{ position: 'absolute', top: position.y, left: position.x, backgroundColor: 'white', border: '1px solid black', padding: '10px', borderRadius: '5px', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        {users.map((user, index) => (
          <span key={index}>{user}</span>
        ))}
      </div>
    );
  };


  // unread message
  const markLastMessageAsSeen = async (maxMessageId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/channels/${channelId}/messages/${maxMessageId}/mark_seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          user_id: userid,
        }),
      });
      const data = await response.json();
      if (!data.Success) {
        console.log("Failed to mark message as seen", data.error);
      }
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  };
  

  return (
    <div className="message-thread">
      {/* Messages */}
      {tooltip.visible && <Tooltip users={tooltip.users} position={tooltip.position} />}
      
      {messages.length > 0 ? (
        messages.map((message) => (
          
          
          <div key={message.id} className="message" onClick={() => handleMessageClick(message)}>
            <div className="message-details">
              <div className="message-author">{message.author}:</div>
              <div className="message-content">{message.content}</div>
              <div className="replies-emojis-container">
                {message.replies_count !== 0 && (
                  <div className="message-replies_count">{message.replies_count} Replies</div>
                )}
                <div className="message-emojis-left">
                  {[...new Set(message.emojis)].map((emoji, index) => (
                    <span key={index} className="emoji" onMouseEnter={(e) => fetchReactionUsers(emoji, message.id, e)} onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}>
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="message-emojis">
              <button className='emoji' onClick={() => reactionTrack("🤯", message.id)}>🤯</button>
              <button className='emoji' onClick={() => reactionTrack("👿", message.id)}>👿</button>
            </div>
          </div>
        ))
      ) : (
        <h3>No messages in this thread</h3>
      )}
    </div>
  );
}

export default MessageThread;


