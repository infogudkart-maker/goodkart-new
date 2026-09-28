import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SellerOverviewTab({ statCards, orders, performanceYear, setPerformanceYear }) {
    // Calculate monthly sales data dynamically from orders
    const monthlySalesData = (() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        const targetYear = performanceYear === 'This Year' ? currentYear : currentYear - 1;
        const monthlyData = months.map(m => ({ name: m, sales: 0, orders: 0 }));

        orders.forEach(order => {
            let orderDate;
            if (order.date) orderDate = new Date(order.date);
            else if (order.createdAt) orderDate = new Date(order.createdAt);
            if (!orderDate || isNaN(orderDate.getTime())) orderDate = new Date();

            const orderYear = orderDate.getFullYear();
            const finalYear = isNaN(orderYear) ? currentYear : orderYear;

            if (finalYear === targetYear) {
                const monthIndex = orderDate.getMonth();
                const finalMonth = (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) ? 0 : monthIndex;
                monthlyData[finalMonth].sales += Number(order.total) || 0;
                monthlyData[finalMonth].orders += 1;
            }
        });
        return monthlyData;
    })();

    return (
        <div className="animate-fade-in flex flex-col gap-6 md:gap-10">
            {/* Panoramic Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {statCards.map((s, i) => (
                    <div key={i} style={{
                        background: 'white', borderRadius: '20px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', position: 'relative', overflow: 'hidden'
                    }} className="p-4 md:p-6 h-32 md:h-40">
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: s.color + '15', color: s.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }} className="md:w-12 md:h-12">
                            {s.icon}
                        </div>
                        <div>
                            <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 leading-none mb-1">{s.value}</h3>
                            <p className="text-slate-500 text-xs md:text-sm font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Analytics */}
            <div style={{
                background: 'white', borderRadius: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                border: '1px solid #f1f5f9'
            }} className="p-4 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 md:mb-6">
                    <div>
                        <h3 className="text-base md:text-xl font-bold text-slate-800">Performance Analytics</h3>
                        <p className="text-slate-500 text-xs md:text-sm">Annual Sales Growth</p>
                    </div>
                    <select
                        value={performanceYear}
                        onChange={(e) => setPerformanceYear(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', color: '#64748b' }}
                    >
                        <option value="This Year">This Year</option>
                        <option value="Last Year">Last Year</option>
                    </select>
                </div>

                <div style={{ width: '100%' }} className="h-56 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlySalesData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `₹${value}`} width={50} />
                            <Tooltip
                                contentStyle={{ background: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`₹${value}`, 'Sales']}
                            />
                            <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


