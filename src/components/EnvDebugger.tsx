'use client';

import { useState } from 'react';

interface EnvVar {
  name: string;
  value: string | undefined;
}

export default function EnvDebugger() {
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const envVars: EnvVar[] = [
    { name: 'NODE_ENV', value: import.meta.env.MODE },
    { name: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
    { name: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✓ Set' : undefined },
    { name: 'VITE_SUPABASE_PROJECT_ID', value: import.meta.env.VITE_SUPABASE_PROJECT_ID },
  ];

  const getValueDisplay = (value: string | undefined) => {
    if (value === undefined) {
      return { text: '[MISSING]', color: '#ef4444' };
    }
    if (value === '') {
      return { text: '[EMPTY]', color: '#eab308' };
    }
    return { text: value, color: '#22c55e' };
  };

  const handlePingTest = async () => {
    const apiUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      setPingStatus('No API URL configured');
      return;
    }

    setIsLoading(true);
    setPingStatus(null);

    try {
      const response = await fetch(apiUrl, { method: 'HEAD', mode: 'no-cors' });
      setPingStatus(`Connection OK (opaque response)`);
    } catch (error) {
      setPingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '0',
    right: '0',
    zIndex: 99999,
    backgroundColor: '#7f1d1d',
    color: '#ffffff',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '11px',
    padding: isMinimized ? '8px 12px' : '16px',
    borderTopLeftRadius: '8px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
    maxWidth: isMinimized ? 'auto' : '400px',
    minWidth: isMinimized ? 'auto' : '320px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMinimized ? '0' : '12px',
    fontWeight: 'bold',
    fontSize: '12px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const cellStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    textAlign: 'left',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#1e40af',
    color: '#ffffff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11px',
    marginTop: '12px',
    width: '100%',
  };

  const minimizeButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '2px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '10px',
  };

  if (isMinimized) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>🔧 ENV</span>
          <button style={minimizeButtonStyle} onClick={() => setIsMinimized(false)}>
            Expand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>🔧 Environment Debugger</span>
        <button style={minimizeButtonStyle} onClick={() => setIsMinimized(true)}>
          Minimize
        </button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...cellStyle, fontWeight: 'bold' }}>Variable</th>
            <th style={{ ...cellStyle, fontWeight: 'bold' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {envVars.map((env) => {
            const display = getValueDisplay(env.value);
            return (
              <tr key={env.name}>
                <td style={cellStyle}>{env.name}</td>
                <td style={{ ...cellStyle, color: display.color, wordBreak: 'break-all' }}>
                  {display.text.length > 40 ? `${display.text.substring(0, 40)}...` : display.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button 
        style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }} 
        onClick={handlePingTest}
        disabled={isLoading}
      >
        {isLoading ? 'Testing...' : 'Test API Connection'}
      </button>

      {pingStatus && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          borderRadius: '4px',
          color: pingStatus.includes('Error') ? '#ef4444' : '#22c55e'
        }}>
          {pingStatus}
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '9px', opacity: 0.7 }}>
        ⚠️ Remove this component before production deploy
      </div>
    </div>
  );
}
