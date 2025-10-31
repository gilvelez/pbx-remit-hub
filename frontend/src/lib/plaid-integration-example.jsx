// Example: Using Plaid Link Token in React Component
// This shows how to integrate the plaid-link-token function with Plaid Link

import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { getPlaidLinkToken } from '@/lib/netlify-api';

export function PlaidIntegrationExample() {
  const [linkToken, setLinkToken] = useState(null);
  const [account, setAccount] = useState(null);

  // Step 1: Get link token from our Netlify function
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const { link_token } = await getPlaidLinkToken('user-123');
        setLinkToken(link_token);
      } catch (error) {
        console.error('Failed to get link token:', error);
      }
    }
    fetchLinkToken();
  }, []);

  // Step 2: Handle successful bank connection
  const onSuccess = useCallback((public_token, metadata) => {
    console.log('Success! Public token:', public_token);
    console.log('Metadata:', metadata);
    
    // Here you would:
    // 1. Send public_token to your backend
    // 2. Exchange it for an access_token
    // 3. Use access_token to fetch account info
    
    setAccount(metadata.accounts[0]);
  }, []);

  // Step 3: Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <div>
      <button
        onClick={() => open()}
        disabled={!ready}
        className="px-4 py-2 bg-sky-600 text-white rounded"
      >
        {ready ? 'Connect Bank Account' : 'Loading...'}
      </button>
      
      {account && (
        <div className="mt-4">
          <h3>Connected Account:</h3>
          <p>Name: {account.name}</p>
          <p>Type: {account.type}</p>
          <p>Mask: {account.mask}</p>
        </div>
      )}
    </div>
  );
}

// Note: You'll need to install react-plaid-link:
// npm install react-plaid-link
