

import React from 'react';
import ReactDOM from 'react-dom/client';
import SignUpPage from './components/SignUpPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* FIX: Added missing 'navigate' and 'goBack' props to satisfy SignUpPageProps. */}
    <SignUpPage navigate={() => {}} goBack={() => {}} />
  </React.StrictMode>
);