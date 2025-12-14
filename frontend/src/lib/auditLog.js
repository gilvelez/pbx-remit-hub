/**
 * Audit logging utility for PBX MVP
 * Console-based for sandbox phase
 * Events: SESSION_VERIFIED, PLAID_LINK_REQUEST_BLOCKED, PLAID_LINK_REQUEST_ALLOWED
 */

export function auditLog(event, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    data,
  };

  console.log(`[AUDIT] ${event}`, logEntry);

  // Store in sessionStorage for debugging (optional)
  try {
    const logs = JSON.parse(sessionStorage.getItem('pbx_audit_logs') || '[]');
    logs.push(logEntry);
    // Keep only last 50 entries
    if (logs.length > 50) logs.shift();
    sessionStorage.setItem('pbx_audit_logs', JSON.stringify(logs));
  } catch (e) {
    // Ignore storage errors
  }
}
