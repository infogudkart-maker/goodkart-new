import { Users, Box, ShoppingCart, ShieldCheck, Truck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/modules/shared/config/firebase';

const StatCard = ({ label, value, icon, color, loading }) => (
    <div style={{ 
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: '140px'
    }}>
        <div className="flex justify-between items-start">
            <div style={{ padding: '0.6rem', borderRadius: '12px', background: `${color}22`, color: color }}>
                {icon}
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{loading ? '-' : value}</h3>
            <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>{label}</p>
        </div>
    </div>
);

const StatCardWithView = ({ label, value, icon, color, onView, loading }) => (
    <div style={{ 
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
        minHeight: '140px'
    }}>
        <div className="flex justify-between items-start">
            <div style={{ padding: '0.6rem', borderRadius: '12px', background: `${color}22`, color: color }}>
                {icon}
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{loading ? '-' : value}</h3>
            <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>{label}</p>
        </div>
        <button
            className="btn btn-secondary"
            onClick={onView}
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
        >
            View
        </button>
    </div>
);

export default function OverviewTab({ stats, loading, setActiveTab, setSearchTerm, setSelectedProductDate }) {
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            // Sign out from Firebase
            await auth.signOut();
            
            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('userName');
            localStorage.removeItem('dob');
            
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('userDataChanged', { detail: null }));
            
            // Navigate to landing page
            navigate('/');
        } catch (error) {
            console.error('Sign out error:', error);
            // Even if Firebase signout fails, clear local data and navigate
            localStorage.removeItem('user');
            localStorage.removeItem('userName');
            localStorage.removeItem('dob');
            navigate('/');
        }
    };

    return (
        <div className="animate-fade-in flex flex-col gap-5">
            {/* Welcome Header */}
            <div style={{
                padding: '1.5rem 2rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: 'white',
                borderRadius: '20px',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(123, 77, 219, 0.25)'
            }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                    Welcome, Admin
                </h1>
                <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                    Manage your marketplace from this central dashboard
                </p>
                
                {/* Sign Out Button */}
                <button
                    onClick={handleSignOut}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.2rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                <StatCardWithView
                    label="Total Sellers"
                    value={stats.allSellers}
                    icon={<Users size={32} />}
                    color="var(--primary)"
                    loading={loading}
                    onView={() => setActiveTab('sellers')}
                />
                <StatCardWithView
                    label="Active Products"
                    value={stats.totalProducts}
                    icon={<Box size={32} />}
                    color="var(--secondary)"
                    loading={loading}
                    onView={() => {
                        setSearchTerm('');
                        setSelectedProductDate('');
                        setActiveTab('products');
                    }}
                />
                <StatCardWithView
                    label="Daily Orders"
                    value={stats.todayOrders}
                    icon={<ShoppingCart size={32} />}
                    color="var(--accent)"
                    loading={loading}
                    onView={() => setActiveTab('orders')}
                />
                <StatCardWithView
                    label="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={<ShieldCheck size={32} />}
                    color="var(--warning)"
                    loading={loading}
                    onView={() => setActiveTab('sellers')}
                />
                <StatCardWithView
                    label="Total Reviews"
                    value={stats.totalFeedback}
                    icon={<Users size={32} />}
                    color="#10b981"
                    loading={loading}
                    onView={() => setActiveTab('feedback')}
                />
                <StatCardWithView
                    label="Orders to Deliver"
                    value={stats.ordersToDeliver}
                    icon={<Truck size={32} />}
                    color="#f59e0b"
                    loading={loading}
                    onView={() => setActiveTab('orders')}
                />
            </div>
        </div>
    );
}

export { StatCard, StatCardWithView };

