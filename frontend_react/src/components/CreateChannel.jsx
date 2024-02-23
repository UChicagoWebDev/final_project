import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import '../styles/createChannel.css'; 

function CreateChannel() {
    const navigate = useNavigate();
    const [channelName, setChannelName] = useState('');
    const [deleteChannelName, setDeleteChannelName] = useState('');

    async function handleCreateSubmit(event) {
        event.preventDefault();
        console.log('Creating channel with name:', channelName);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/create_channel', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                channelName: channelName
              }),
            });
            const data = await response.json();
            console.log("data create channel: ", data)
            if (data.Success) {
              console.log('Create Chennel Success:', data);
              navigate('/home'); 
            } else {
              console.log('Create failed');
            }
          } catch (error) {
            console.error('Error during create channel:', error);
          }
    }

    async function handleDeleteSubmit(event) {
        event.preventDefault();
        console.log('Deleting channel with name:', deleteChannelName);
        // Delete
    }

    return (
        <>
            <NavBar username={sessionStorage.getItem("username")} />
            <div className="channel-container">
                <div className="create-channel-form">
                    <h1>Create Channel</h1>
                    <form onSubmit={handleCreateSubmit}>
                        <div className="form-group">
                            <label htmlFor="createChannelName">Channel Name:</label>
                            <input
                                id="createChannelName"
                                type="text"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="submit-button">Create</button>
                    </form>
                </div>
                <div className="delete-channel-form">
                    <h1>Delete Channel</h1>
                    <form onSubmit={handleDeleteSubmit}>
                        <div className="form-group">
                            <label htmlFor="deleteChannelName">Channel Name:</label>
                            <input
                                id="deleteChannelName"
                                type="text"
                                value={deleteChannelName}
                                onChange={(e) => setDeleteChannelName(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="delete-button">Delete</button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default CreateChannel;

