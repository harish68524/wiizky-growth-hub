import React, { useState, useEffect } from 'react';

const Dashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${user._id}`);
        const data = await response.json();
        if (data.success) setOrders(data.orders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user._id]);

  if (loading) return <div className="text-blue-500 animate-pulse text-center mt-10 font-bold">Loading history...</div>;

  return (
    <div className="w-full max-w-5xl p-8 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order History</h2>
        <span className="text-sm font-bold text-gray-500 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
          {orders.length} Orders
        </span>
      </div>
      
      {orders.length === 0 ? (
        // Premium Empty State
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-gradient-to-tr from-gray-100 to-white rounded-full flex items-center justify-center mb-5 shadow-inner border border-gray-100">
            <span className="text-3xl">🚀</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 font-medium text-center max-w-sm">
            You haven't placed any orders. Head over to the Services tab to boost your profile!
          </p>
        </div>
      ) : (
        // Premium Table
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase font-extrabold bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">Order ID</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 rounded-tr-2xl text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-white/60 transition-colors duration-200">
                  <td className="px-6 py-5 font-mono text-blue-600 font-bold text-xs">{order.internalOrderId}</td>
                  <td className="px-6 py-5 font-bold text-gray-800 capitalize">{order.serviceType}</td>
                  <td className="px-6 py-5 font-semibold text-gray-600">{order.quantity.toLocaleString()}</td>
                  <td className="px-6 py-5 font-extrabold text-gray-900">₹{order.pricePaid}</td>
                  <td className="px-6 py-5 text-right">
                    {/* Dynamic Status Badge */}
                    <span className={`px-4 py-1.5 text-xs font-bold rounded-full border ${
                      order.status === 'Processing' 
                        ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.2)]' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;