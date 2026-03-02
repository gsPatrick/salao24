

import React from 'react';
import ReactDOM from 'react-dom/client';
import LoginPage from './components/LoginPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* FIX: Added missing 'onLoginSuccess' prop to satisfy LoginPageProps. */}
    <LoginPage 
      navigate={() => {}} 
      goBack={() => {}} 
      onLoginSuccess={(user) => { console.log("Login successful for standalone page:", user); }}
    />
  </React.StrictMode>
);