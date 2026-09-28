import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', background: '#fef2f2', minHeight: '100vh', fontFamily: 'system-ui' }}>
                    <h1 style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>Something went wrong.</h1>
                    <p style={{ marginTop: '20px', color: '#7f1d1d' }}>The application encountered an unexpected error.</p>

                    <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #fca5a5' }}>
                        <h3 style={{ color: '#b91c1c', marginBottom: '10px' }}>Error Details:</h3>
                        <pre style={{ color: '#991b1b', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <h3 style={{ color: '#b91c1c', marginTop: '20px', marginBottom: '10px' }}>Component Stack:</h3>
                        <pre style={{ color: '#991b1b', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '30px', padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Return to Home Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

