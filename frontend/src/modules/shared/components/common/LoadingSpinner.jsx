import './LoadingSpinner.css';

export default function LoadingSpinner({ 
    size = 'medium', 
    fullScreen = false, 
    message = 'Loading...',
    variant = 'default' 
}) {
    const sizeClasses = {
        small: 'spinner-small',
        medium: 'spinner-medium',
        large: 'spinner-large'
    };

    if (fullScreen) {
        return (
            <div className="loading-fullscreen-container">
                <div className="loading-content">
                    <div className={`loading-spinner-simple ${sizeClasses[size]}`}></div>
                    {message && <p className="loading-message">{message}</p>}
                </div>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className="loading-inline">
                <div className={`loading-spinner-simple ${sizeClasses[size]}`}></div>
                {message && <span className="loading-message-inline">{message}</span>}
            </div>
        );
    }

    return (
        <div className="loading-container">
            <div className={`loading-spinner-simple ${sizeClasses[size]}`}></div>
            {message && <p className="loading-message">{message}</p>}
        </div>
    );
}

