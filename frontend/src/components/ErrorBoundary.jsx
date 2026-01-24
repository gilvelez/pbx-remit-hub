import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    console.error("UI Crash:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 16 }}>Something went wrong.</h2>
          <pre style={{ 
            whiteSpace: "pre-wrap", 
            background: '#fef2f2', 
            padding: 16, 
            borderRadius: 8,
            color: '#991b1b',
            fontSize: 14
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#0A2540',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
