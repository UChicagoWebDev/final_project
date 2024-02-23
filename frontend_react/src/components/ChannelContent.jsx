// ChannelContent.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from './NavBar';
import ChannelList from './ChannelList';
import MessageThread from './MessageThread'; 
import ReplyThread from './ReplyThread'; 
import '../styles/channelContent.css';

function ChannelContent() {
    const username = sessionStorage.getItem("username");
    const userid = sessionStorage.getItem("user_id");
    const { channelId, messageId } = useParams();
    const [channelName, setChannelName] = useState('');
    const [message, setMessage] = useState('');

    const [showReplyThread, setShowReplyThread] = useState(true);

    useEffect(() => {
        fetchChannelDetails();
        setShowReplyThread(false);
    }, [channelId]); 

    const toggleReplyThreadVisibility = () => {
        setShowReplyThread(!showReplyThread);
    };

    const fetchChannelDetails = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/channel/${channelId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.Success) {
                setChannelName(data.message.name); 
            } else {
                console.log('Channel not found');
            }
        } catch (error) {
            console.error('Error fetching channel details:', error);
        }
    };


    const postMessage = async () => {
        if (!message.trim()) {
            alert("Please enter a message.");
            return;
        }
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/channels/${channelId}/messages/post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userid: userid, 
                    content: message,
                }),
            });
            const data = await response.json();
            if (data.Success) {
                console.log('Message posted successfully');
                setMessage(''); 
            } else {
                console.log('Failed to post message:', data.error);
            }
        } catch (error) {
            console.error('Error posting message:', error);
        }
    };



    return (
        <div className="home-container">
            <NavBar username={username} />
            <div className="main-content">
                <ChannelList className="channel-list"/>
                <div className="channel-content">
                    <div className="channel-name">
                        <h2>Channel: {channelName}</h2>
                        <button onClick={toggleReplyThreadVisibility} className="toggle-reply-thread">
                            {showReplyThread ? 'Hide Replies' : 'Show Replies'}
                        </button>
                    </div>
                    <MessageThread />
                    <div className="message-input-container">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="message-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button className="post-message-button" onClick={postMessage}>Send</button>
                    </div>
                </div>
                {showReplyThread && <ReplyThread className="reply-thread" messageId={messageId}/>} 
            </div>
        </div>
    );
}

export default ChannelContent;


