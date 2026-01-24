

import React from 'react';
import ReactDOM from 'react-dom/client';
import TrialPage from './components/TrialPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TrialPage 
        navigate={() => {}} 
        goBack={() => {}} 
        // FIX: Added the missing 'contract' parameter to the onTrialSuccess callback to match the expected function signature.
        onTrialSuccess={(user, contract) => console.log('Trial successful for standalone page:', user, contract)}
        selectedPlan={null}
        allClients={[]}
        // FIX: Added missing 'onStartSignatureFlow' prop to satisfy TrialPageProps.
        onStartSignatureFlow={() => {}}
    />
  </React.StrictMode>
);