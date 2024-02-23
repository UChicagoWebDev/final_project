// MessageThread.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/messageThread.css';

function MessageThread() {
  const { channelId } = useParams(); 
  const [messages, setMessages] = useState([]); 

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/channels/${channelId}/messages`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.Success) {
          setMessages(data.message); 
        } else {
          console.log('Failed to fetch messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [channelId]); 


  const handleMessageClick = (message) => {
    console.log("Clicked message:", message.content);
    // reply thread
  };

  return (
    <div className="message-thread">
      {messages.length > 0 ? (
        messages.map((message) => (
          <div key={message.id} className="message" onClick={() => handleMessageClick(message)}>
            <div className="message-author">{message.author}:</div>
            <div className="message-content">{message.content}</div>
          </div>
        ))
      ) : (
        <h3>No messages in this thread</h3>
      )}
    </div>
  );
}

export default MessageThread;