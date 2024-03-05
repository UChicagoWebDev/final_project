// ReplyThread.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/replyThread.css';
import LastReply from './LastReply'; 

function ReplyThread({ messageId }) {
  const username = sessionStorage.getItem("username");
  const userid = sessionStorage.getItem("user_id");
  const apiKey = sessionStorage.getItem(`${username}_api_key`);

  const { channelId } = useParams();
  const [messageDetails, setMessageDetails] = useState(null);
  const [reply, setReply] = useState('');


  useEffect(() => {
    if (messageId) {
      fetchMessageDetails();
    }
  }, [messageId]);

  // for showing thread name and username on the top
  const fetchMessageDetails = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/messages/${messageId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log("message data: ", data)
      if (data.Success) {
        setMessageDetails(data.message);
        console.log("messageDetails: ", messageDetails )
      } else {
        console.log('Failed to fetch message details');
      }
    } catch (error) {
      console.error('Error fetching message details:', error);
    }
  };


  const postReply= async () => {
    if (!reply.trim()) {
        alert("Please enter a reply.");
        return;
    }
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/channels/${channelId}/messages/${messageId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                userid: userid, 
                content: reply,
            }),
        });
        const data = await response.json();
        if (data.Success) {
            console.log('Reply posted successfully');
            setReply(''); 
        } else {
            console.log('Failed to post reply:', data.error);
        }
    } catch (error) {
        console.error('Error posting message:', error);
    }
};

  return (
    <div className="reply-thread">
      {messageDetails && (
        <>
          <div className="message-details">
            <div className="message-author">{messageDetails.author}:</div>
            <div className="message-content">{messageDetails.content}</div>
          </div>
          <div className="replies-container">
            <LastReply />
          </div>
          <div className="reply-input-container">
            <input
              type="text"
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="reply-input"
            />
            <button className="send-reply-button" onClick={postReply}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ReplyThread;
