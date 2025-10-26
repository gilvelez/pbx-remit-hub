// Mock data for PBX landing page - Sandbox only, no real funds

export const mockBalance = {
  usd: 1250.0,
  transactions: [
    { id: 1, amount: 200, recipient: 'GCash Wallet', status: 'completed', date: '2025-08-15' },
    { id: 2, amount: 500, recipient: 'BPI Bank Account', status: 'completed', date: '2025-08-14' },
    { id: 3, amount: 75, recipient: 'GCash Wallet', status: 'pending', date: '2025-08-16' },
    { id: 4, amount: 150, recipient: 'UnionBank', status: 'completed', date: '2025-08-13' },
  ]
};

export const mockSubmissions = [
  { id: 1, email: 'john@example.com', timestamp: '2025-08-15T10:30:00Z' },
  { id: 2, email: 'maria@example.com', timestamp: '2025-08-15T11:45:00Z' },
  { id: 3, email: 'carlos@example.com', timestamp: '2025-08-15T14:20:00Z' },
];

// Helper to add mock submission (stores in localStorage for demo)
export const addMockSubmission = (email) => {
  const existing = JSON.parse(localStorage.getItem('pbx_submissions') || '[]');
  const newSubmission = {
    id: Date.now(),
    email,
    timestamp: new Date().toISOString()
  };
  const updated = [newSubmission, ...existing];
  localStorage.setItem('pbx_submissions', JSON.stringify(updated));
  return newSubmission;
};

// Get all submissions from localStorage
export const getMockSubmissions = () => {
  const stored = JSON.parse(localStorage.getItem('pbx_submissions') || '[]');
  return stored.length > 0 ? stored : mockSubmissions;
};
