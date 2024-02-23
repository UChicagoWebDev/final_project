// MessageThread.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import '../styles/lastReply.css';

function LastReply() {
  // const navigate = useNavigate();
  const userid = sessionStorage.getItem("user_id");
  const { channelId, messageId } = useParams(); 
  const [replies, setReplies] = useState([]); 

  useEffect(() => {
    fetchReplies();

    // Set up an interval to fetch messages every 500ms
    const intervalId = setInterval(fetchReplies, 5000);

    // Cleanup function to clear the interval when the component unmounts
    // or if the channelId changes
    return () => clearInterval(intervalId);
  }, [messageId]); 


  const fetchReplies = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/channels/${channelId}/messages/${messageId}/get`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.Success) {
        console.log("replies: ", data.replies)
        setReplies(data.replies); 
      } else {
        console.log('Failed to fetch replies');
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
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
    <div className="reply-thread">
      {replies.length > 0 ? (
        replies.map((reply) => (
          <div key={reply.id} className="reply">
            <div className="reply-details">
              <div className="reply-author">{reply.author}:</div>
              <div className="reply-content">{reply.content}</div>
              <div className="replies-emojis-container">
                <div className="replies-emojis-left">
                  {reply.emojis.map((emoji, index) => (
                    <span key={index} className="emoji">{emoji}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="reply-emojis">
              <button className='emoji' onClick={() => reactionTrack("🤯", reply.id)}>🤯</button>
              <button className='emoji' onClick={() => reactionTrack("👿", reply.id)}>👿</button>
            </div>
          </div>
        ))
      ) : (
        <h3>No replies in this thread</h3>
      )}
    </div>
  );
}

export default LastReply;