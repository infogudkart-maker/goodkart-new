import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ADMIN_PHONE = '+917483743936';

export default function ProtectedRoute({ children, requiredRole = null }) {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const checkAuthorization = () => {
            const key = requiredRole === 'SELLER' ? 'seller_user' : 'user';
            const user = localStorage.getItem(key);

            if (!user) {
                setIsAuthorized(false);
                return;
            }

            try {
                const userData = JSON.parse(user);

                // Check for admin access
                if (requiredRole === 'ADMIN') {
                    // Role must be ADMIN. Phone check is secondary/master-only.
                    if (userData.role !== 'ADMIN') {
                        console.warn(`Unauthorized admin access - Role: ${userData.role}`);
                        setIsAuthorized(false);
                        return;
                    }
                }

                // Check for seller access
                if (requiredRole === 'SELLER') {
                    if (userData.role !== 'SELLER') {
                        console.warn(`Unauthorized seller access - Role: ${userData.role}`);
                        setIsAuthorized(false);
                        return;
                    }
                }

                // Check for consumer access
                if (requiredRole === 'CONSUMER') {
                    // SELLER and ADMIN roles are allowed to access consumer routes (shopping, etc.)
                    const allowedRoles = ['CONSUMER', 'SELLER', 'ADMIN'];
                    if (!allowedRoles.includes(userData.role)) {
                        console.warn(`Unauthorized consumer access - Role: ${userData.role}`);
                        setIsAuthorized(false);
                        return;
                    }
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
                setIsAuthorized(false);
            }
        };

        // Check authorization on mount
        checkAuthorization();

        // Retry after 600ms to handle race condition where localStorage
        // is written slightly after navigation (phone/email login)
        const retryTimer = setTimeout(checkAuthorization, 600);

        // Listen for custom userDataChanged event
        const handleUserChange = () => {
            checkAuthorization();
        };

        window.addEventListener('userDataChanged', handleUserChange);
        window.addEventListener('storage', handleUserChange);

        return () => {
            clearTimeout(retryTimer);
            window.removeEventListener('userDataChanged', handleUserChange);
            window.removeEventListener('storage', handleUserChange);
        };
    }, [requiredRole]);

    // Navigate to home if authorization is lost
    useEffect(() => {
        if (isAuthorized === false) {
            const redirectPath = requiredRole === 'SELLER' ? '/seller' : '/';
            navigate(redirectPath, { replace: true});

            // Only trigger the login modal for general consumer routes
            if (requiredRole === 'CONSUMER' || !requiredRole) {
                // Short timeout to ensure navigation completed
                setTimeout(() => {
                    window.dispatchEvent(new Event('openLoginModal'));
                }, 100);
            }
        }
    }, [isAuthorized, navigate, requiredRole]);

    if (isAuthorized === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
            </div>
        );
    }

    if (isAuthorized === false) {
        return <Navigate to="/" replace />;
    }

    return children;
}





