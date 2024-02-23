import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(event) {
    event.preventDefault(); 
    console.log('Attempting to login with:', username, password);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: username,
          pass: password,
        }),
      });
      const data = await response.json();
      console.log("data login: ", data)
      if (data.Success) {
        console.log('Login Success:', data);
        sessionStorage.setItem('username', data.user_name);
        sessionStorage.setItem('user_id', data.user_id);
        sessionStorage.setItem(`${data.user_name}_api_key`, data.api_key);
        console.log(sessionStorage);
        navigate('/home'); 
      } else {
        console.log('Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  }


  async function handleRegister(event) {
    // navigate('/register');
    event.preventDefault();  
    console.log('Attempting to signup with:', username, password);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/signup', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: username,
          pass: password,
        }),
      });
      const data = await response.json();
      console.log("data: ", data)
      console.log("data.Success: ", data.success)
      if (data.Success) {
        console.log('Signup Success:', data);
        sessionStorage.setItem('username', data.user_name);
        sessionStorage.setItem('user_id', data.user_id);
        sessionStorage.setItem(`${data.user_name}_api_key`, data.api_key);
        console.log(sessionStorage);
        navigate('/home'); 
      } else {
        console.log('Signup failed');
      }
    } catch (error) {
      console.error('Error during signup:', error);
    }
  }


  return (
    <div className="login-container">
      <h1>Welcome to Belay</h1>
      <form>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            placeholder='Please Enter CNetID'
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        <button type="submit" className="login-button" onClick={handleLogin}>Login</button>
        <button type="button" className="register-button" onClick={handleRegister}>Sign Up</button>
      </form>
    </div>
  );
}

export default Login;
