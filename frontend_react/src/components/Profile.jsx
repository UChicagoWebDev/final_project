import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import '../styles/profile.css'; 

function Profile() {
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const username = sessionStorage.getItem("username");
    const apiKey = sessionStorage.getItem(`${username}_api_key`); // Assuming the API key is stored in sessionStorage


    const updateUsername = async (e) => {
      e.preventDefault(); // Prevent the form from causing a page reload
      if (!newName) {
          setMessage("Please enter a new username.");
          return;
      }
      try {
          const response = await fetch('http://127.0.0.1:5000/api/update_username', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': apiKey
              },
              body: JSON.stringify({
                  api_key: apiKey,
                  new_name: newName,
              }),
          });
  
          const data = await response.json();
          setMessage(data.message);
          if (data.success) {
              // Before updating sessionStorage, remove the old username's API key
              const oldApiKeyKeyName = `${username}_api_key`;
              sessionStorage.removeItem(oldApiKeyKeyName); // Remove the old API key
              
              // Now update the sessionStorage with the new username and API key
              sessionStorage.setItem('username', newName);
              sessionStorage.setItem(`${newName}_api_key`, apiKey);
              
              console.log("Session updated: ", sessionStorage);
              // navigate('/some-other-page'); // Redirect the user to another page if needed
          }
      } catch (error) {
          console.error('Error updating username:', error);
          setMessage("Failed to update username. Please try again.");
      }
  };
  


    const updatePassword = async (e) => {
      e.preventDefault();
      if (!newPassword || !confirmPassword || newPassword !== confirmPassword) {
          setMessage("Passwords do not match or are missing.");
          return;
      }
      try {
          const response = await fetch('http://127.0.0.1:5000/api/update_password', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': apiKey
              },
              body: JSON.stringify({
                  api_key: apiKey,
                  new_password: newPassword,
                  confirm_password: confirmPassword,
              }),
          });
          
          const data = await response.json();
          console.log("session: ", sessionStorage)
          setMessage(data.message);
          if (data.success) {
              console.log("success updated password")
              // Handle successful password update, e.g., clear form, redirect, etc.
          }
      } catch (error) {
          console.error('Error updating password:', error);
          setMessage("Failed to update password. Please try again.");
      }
  };


    return (
      <>
        <NavBar username={username} />
        <div className="profile-container">
            <form onSubmit={updateUsername} className="update-username-form">
                <label>
                    New Username:
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter new username"
                    />
                </label>
                <button type="submit">Update Username</button>
            </form>
            <form onSubmit={updatePassword} className="update-password-form">
                <label>
                    New Password:
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                    />
                </label>
                <label>
                    Confirm Password:
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                    />
                </label>
                <button type="submit">Update Password</button>
            </form>
            {message && <p>{message}</p>}
        </div>
      </>
    );
}

export default Profile;
