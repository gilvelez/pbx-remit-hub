// Example: How to use netlify-api.js in your components

import { createLead, getPlaidLinkToken } from '@/lib/netlify-api';

// Example 1: Email signup form
async function handleEmailSubmit(email) {
  try {
    const result = await createLead(email);
    console.log('Lead created:', result);
    // Show success message
  } catch (error) {
    console.error('Failed to create lead:', error);
    // Show error message
  }
}

// Example 2: Plaid integration
async function handleConnectBank() {
  try {
    const { link_token } = await getPlaidLinkToken('user-123');
    // Use link_token to open Plaid Link
    console.log('Link token:', link_token);
  } catch (error) {
    console.error('Failed to get link token:', error);
  }
}

// Example 3: Generic API call
import { api } from '@/lib/netlify-api';

async function customApiCall() {
  try {
    const result = await api('/.netlify/functions/my-custom-function', {
      method: 'POST',
      body: { custom: 'data' }
    });
    return result;
  } catch (error) {
    console.error('API call failed:', error);
  }
}
