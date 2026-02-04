import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Что-то пошло не так</h1>
          <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
            {this.state.error?.message || 'Произошла ошибка при загрузке приложения'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Перезагрузить страницу
          </button>
          <details style={{ marginTop: '2rem', maxWidth: '600px', width: '100%' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Детали ошибки</summary>
            <pre style={{
              padding: '1rem',
              backgroundColor: '#1a1a1a',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}>
              {this.state.error?.stack || this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
