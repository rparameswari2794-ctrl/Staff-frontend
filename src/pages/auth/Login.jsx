// src/pages/auth/Login.jsx (or wherever your login component lives)
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ✅ added Link import
import api from '../../services/api'; // adjust path if your folder structure differs
import { useDispatch } from 'react-redux'; // add this
import { login } from '../../store/slices/authSliceS'; // adjust path


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // In Login.jsx, update handleSubmit:
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('1. Form submitted');
  console.log('2. Username:', username);
  console.log('3. Password:', password);
  
  try {
    console.log('4. About to dispatch login');
    const resultAction = await dispatch(login({ username, password }));
    console.log('5. Dispatch result:', resultAction);
    
    if (login.fulfilled.match(resultAction)) {
      console.log('6. Login fulfilled, navigating to /');
      navigate('/');
    } else {
      console.log('7. Login rejected:', resultAction.payload);
      setError('Invalid username or password');
    }
  } catch (err) {
    console.log('8. Caught error:', err);
    setError('An error occurred');
  }
};

  return (
    <div className="login-container">
        <h3>Login</h3>
        <div className="register-line">
            <p>Create a New Profile:</p>
          {/* ✅ Link now works because it's imported */}
          <p><a href="/register">Register</a></p>
        </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        
        {error && <p className="error text-danger">{error}</p>}
        <button type="submit" className='btn btn-primary login-btn'>Log In</button>
        
      </form>
    </div>
  );
};

export default Login;