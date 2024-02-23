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
      // console.log("data: ", data);
      if (data.Success) {
        setMessages(data.message); 
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

  return (
    <div className="message-thread">
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
                  {message.emojis.map((emoji, index) => (
                    <span key={index} className="emoji">{emoji}</span>
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
