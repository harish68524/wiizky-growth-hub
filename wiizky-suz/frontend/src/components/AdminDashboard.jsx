import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  // Navigation & Data State
  const [activeTab, setActiveTab] = useState('orders'); 
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table Filter State
  const [orderFilter, setOrderFilter] = useState('active'); // 'active', 'completed', 'all'
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  
  // Provider & Settings State
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [providerServices, setProviderServices] = useState([]);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [settings, setSettings] = useState(null); 
  const [mappingModal, setMappingModal] = useState({ isOpen: false, providerId: null, providerName: null });
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [serviceSearch, setServiceSearch] = useState(''); // Live search for catalog

  // Wallet Balance State
  const [providerBalance, setProviderBalance] = useState(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  // ==========================================
  // AUTOMATED METRICS CALCULATIONS
  // ==========================================
  const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.pricePaid || 0), 0);
  const totalOrders = allOrders.length;
  const [expandedCategory, setExpandedCategory] = useState(null);
  const pendingOrders = allOrders.filter(o => o.status?.toLowerCase() === 'pending').length;
  const processingOrders = allOrders.filter(o => ['processing', 'in progress'].includes(o.status?.toLowerCase())).length;
  const completedOrders = allOrders.filter(o => o.status?.toLowerCase() === 'completed').length;
  const cancelledOrders = allOrders.filter(o => ['canceled', 'cancelled'].includes(o.status?.toLowerCase())).length;
  const failedOrders = allOrders.filter(o => o.apiOrderId?.includes('FAILED') || o.status?.toLowerCase() === 'failed').length;

  // ==========================================
  // INITIAL DATA FETCH
  // ==========================================
  const fetchWalletBalance = async () => {
    setRefreshingBalance(true);
    try {
      const res = await fetch('http://localhost:5000/api/orders/admin/balance');
      const data = await res.json();
      if (data.success) {
        setProviderBalance(data.balance);
      }
    } catch (e) {
      console.error("Failed to fetch balance", e);
    } finally {
      setRefreshingBalance(false);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const orderRes = await fetch('http://localhost:5000/api/orders/admin/all');
        const orderData = await orderRes.json();
        if (orderData.success) setAllOrders(orderData.orders);

        const settingsRes = await fetch('http://localhost:5000/api/orders/admin/settings');
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings);
          setApiUrl(settingsData.settings.smmApiUrl || '');
          setApiKey(settingsData.settings.smmApiKey || '');
        }
        
        fetchWalletBalance();
        
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchAllData();
  }, []);

  // ==========================================
  // ORDER AUTOMATION ACTIONS
  // ==========================================
  const handleSyncStatus = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/admin/${orderId}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAllOrders(allOrders.map(o => o._id === orderId ? data.order : o));
      } else { alert("Sync Failed: " + data.message); }
    } catch (e) { alert("Network Error."); }
  };

  const handleResendOrder = async (orderId) => {
    if(!window.confirm("Are you sure you want to resend this to the SMM provider? It will cost balance.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/admin/${orderId}/resend`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("Sent successfully! New API ID assigned.");
        setAllOrders(allOrders.map(o => o._id === orderId ? data.order : o));
      } else { alert("Resend Failed: " + data.message); }
    } catch (e) { alert("Network Error."); }
  };

  const handleDeleteOrder = async (orderId) => {
    if(!window.confirm("Delete this order permanently? This cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/admin/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAllOrders(allOrders.filter(o => o._id !== orderId)); 
      }
    } catch (e) { alert("Network Error."); }
  };

  // ==========================================
  // PROVIDER MAPPING ACTIONS
  // ==========================================
  const handleFetchServices = async (e) => {
    if(e) e.preventDefault();
    if(!apiUrl || !apiKey) return alert("Please enter both URL and Key");
    setFetchingServices(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders/admin/fetch-services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl, apiKey })
      });
      const data = await response.json();
      if (data.success) {
        setProviderServices(data.services);
        await fetch('http://localhost:5000/api/orders/admin/settings', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ smmApiUrl: apiUrl, smmApiKey: apiKey })
        });
      } else { alert("Failed to connect: " + data.message); }
    } catch (error) { alert("Network error connecting to provider."); } 
    finally { setFetchingServices(false); }
  };

  const handleMapService = (service) => {
    setMappingModal({
      isOpen: true,
      providerId: service.service,
      providerName: service.name
    });
  };

  const saveMappingToDatabase = async (wiizkyServiceKey) => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/admin/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceMappings: { [wiizkyServiceKey]: mappingModal.providerId.toString() } })
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings); 
        setMappingModal({ isOpen: false, providerId: null, providerName: null }); 
      } else { alert("Backend Error: " + data.message); }
    } catch (error) { alert("Network error while saving connection."); }
  };

  // ==========================================
  // DATA FILTERS
  // ==========================================
  const filteredOrders = allOrders.filter(order => {
    const status = order.status?.toLowerCase() || '';
    const isDone = ['completed', 'canceled', 'cancelled'].includes(status);
    
    if (orderFilter === 'active') return !isDone;
    if (orderFilter === 'completed') return isDone;
    return true; 
  });

  const filteredProviderServices = providerServices.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
    s.service.toString().includes(serviceSearch)
  );

  // ==========================================
  // RENDER UI
  // ==========================================
  if (loading) return <div className="text-center mt-20 font-bold text-purple-600 animate-pulse">Loading Command Center...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 relative">
      
      {/* 🟢 HEADER, WIDGET & TABS */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Command Center</h1>
          <p className="text-gray-500 font-medium mt-1">Manage orders and API connections.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* LIVE WALLET WIDGET */}
          <div className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm border border-gray-800">
            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Supplier Wallet</span>
            <span className="text-emerald-400 text-base">
              {providerBalance !== null ? `₹${Number(providerBalance).toFixed(2)}` : '...'}
            </span>
            <button onClick={fetchWalletBalance} className={`text-gray-400 hover:text-white transition-all ${refreshingBalance ? 'animate-spin' : ''}`} title="Refresh Balance">🔄</button>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button onClick={() => setActiveTab('orders')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Manage Orders</button>
            <button onClick={() => setActiveTab('providers')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'providers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>API Providers</button>
          </div>
        </div>
      </div>

      {/* 🟢 TAB 1: ORDERS OVERVIEW */}
      {activeTab === 'orders' && (
        <>
          {/* 7-METRIC KPI RIBBON */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Revenue</span>
              <span className="text-2xl font-black text-emerald-500">₹{totalRevenue.toFixed(2)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</span>
              <span className="text-2xl font-black text-gray-900">{totalOrders}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col bg-blue-50/30">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Pending</span>
              <span className="text-2xl font-black text-blue-700">{pendingOrders}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col bg-purple-50/30">
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">Processing</span>
              <span className="text-2xl font-black text-purple-700">{processingOrders}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col bg-emerald-50/30">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Completed</span>
              <span className="text-2xl font-black text-emerald-700">{completedOrders}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Cancelled</span>
              <span className="text-2xl font-black text-gray-700">{cancelledOrders}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex flex-col bg-red-50/30">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Failed</span>
              <span className="text-2xl font-black text-red-600">{failedOrders}</span>
            </div>
          </div>

          {/* TABLE FILTERS */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setOrderFilter('active')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${orderFilter === 'active' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>🟢 Active & Failed</button>
            <button onClick={() => setOrderFilter('completed')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${orderFilter === 'completed' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>✓ Completed</button>
            <button onClick={() => setOrderFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${orderFilter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>📂 View All</button>
          </div>

          {/* MASTER ORDER TABLE */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase font-extrabold bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">API ID</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Link</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium">No orders found in this category.</td></tr>
                  ) : filteredOrders.map((order) => {
                    const isFailed = order.apiOrderId?.includes('FAILED') || order.apiOrderId?.includes('MANUAL') || order.status?.toLowerCase() === 'failed';
                    const isCompleted = ['completed', 'canceled', 'cancelled'].includes(order.status?.toLowerCase());
                    const isMock = order.apiOrderId?.includes('MOCK') || order.apiOrderId?.includes('TEST');
                    
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-gray-400">{order.apiOrderId || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 capitalize">{order.serviceType}</div>
                          <div className="text-xs text-gray-500 font-medium">Qty: {order.quantity.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <a href={order.instagramLink} target="_blank" rel="noreferrer" className="text-blue-500 font-medium hover:underline block max-w-[150px] truncate">{order.instagramLink}</a>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isFailed ? 'bg-red-100 text-red-700' :
                            order.status?.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            ['canceled', 'cancelled'].includes(order.status?.toLowerCase()) ? 'bg-gray-200 text-gray-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{order.status || 'Pending'}</span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {isFailed ? (
                              <button onClick={() => handleResendOrder(order._id)} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Resend 🔄</button>
                          ) : !isCompleted && !isMock ? (
                              <button onClick={() => handleSyncStatus(order._id)} className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Sync Live 📡</button>
                          ) : isCompleted ? (
                            <span className="text-xs font-bold text-gray-400 py-1.5">Done ✓</span>
                          ) : null}
                          
                          {(isFailed || isMock) && (
                            <button onClick={() => handleDeleteOrder(order._id)} className="text-gray-400 hover:text-red-500 px-2 py-1.5 transition-colors" title="Delete Test Order">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 🟢 TAB 2: API PROVIDERS */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            
            {/* CONNECTION BOX */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">🔗 Connect Provider</h2>
              <form onSubmit={handleFetchServices} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Provider API URL</label>
                  <input type="url" required value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Provider API Key</label>
                  <input type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-sm" />
                </div>
                <button type="submit" disabled={fetchingServices} className="w-full py-3 mt-2 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors">
                  {fetchingServices ? 'Connecting...' : 'Connect & Fetch'}
                </button>
              </form>
            </div>

            {/* DYNAMIC ACTIVE CONNECTIONS BOX */}
            <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-blue-900 mb-4 uppercase tracking-wider">Active Service Connections</h2>
              <div className="space-y-3">
                {settings?.prices && Object.keys(settings.prices).map(serviceKey => (
                  <div key={serviceKey} className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <span className="text-sm font-bold text-gray-700 capitalize">{serviceKey.replace(/_/g, ' ')}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${settings.serviceMappings?.[serviceKey] ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      {settings.serviceMappings?.[serviceKey] ? `ID: ${settings.serviceMappings[serviceKey]}` : 'Not Set'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================== */}
            {/* 🛠️ CUSTOM SERVICE BUILDER                  */}
            {/* ========================================== */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
              <h3 className="font-extrabold text-gray-900 text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add Custom Service
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Service Name (e.g., Telegram Views)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Base Price / 1k (₹)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (!newServiceName || !newServicePrice) return alert("Fill all fields");
                    
                    const safeKey = newServiceName.toLowerCase().trim().replace(/\s+/g, '_');
                    
                    const updatedPrices = { ...settings.prices, [safeKey]: Number(newServicePrice) };
                    const updatedMappings = { ...settings.serviceMappings, [safeKey]: '' };

                    try {
                      const res = await fetch('http://localhost:5000/api/orders/admin/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prices: updatedPrices, serviceMappings: updatedMappings })
                      });
                      if (res.ok) {
                        alert("Service Added! You can now map it above and users can buy it.");
                        setSettings(await res.json()); 
                        setNewServiceName('');
                        setNewServicePrice('');
                        window.location.reload(); 
                      }
                    } catch (err) { alert("Failed to add service"); }
                  }}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all"
                >
                  Add to Storefront
                </button>
              </div>
            </div>

          </div>

          {/* ========================================== */}
          {/* 🗂️ CATEGORIZED PROVIDER SERVICE CATALOG   */}
          {/* ========================================== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px] w-full lg:col-span-2 flex-1">
            
            {/* Catalog Header with Search and Filter */}
            <div className="p-6 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/50 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  Provider Catalog
                  <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-md">
                    {providerServices.length} Total
                  </span>
                </h3>
              </div>
              
              <div className="flex gap-3">
                {/* Dynamic Category Filter Dropdown */}
                <select 
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white text-gray-900"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All" className="text-gray-900 bg-white font-medium">All Categories</option>
                  
                  {/* Magically extracts every unique category from the 781 services */}
                  {[...new Set(providerServices.map(s => s.category || 'Other'))].map(cat => (
                    <option key={cat} value={cat} className="text-gray-900 bg-white font-medium">
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Search Bar */}
                <input 
                  type="text" 
                  placeholder="Search services..." 
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Categorized Accordion List */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {Object.entries(
                providerServices
                  .filter(s => categoryFilter === 'All' || s.category === categoryFilter)
                  .filter(s => s.name.toLowerCase().includes((serviceSearch || '').toLowerCase()) || s.service.toString().includes(serviceSearch || ''))
                  .reduce((groups, service) => {
                    const cat = service.category || 'Other Services';
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(service);
                    return groups;
                  }, {})
              ).map(([categoryName, servicesInCategory]) => (
                
                <div key={categoryName} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  
                  {/* Category Header (Click to expand) */}
                  <div 
                    className={`px-4 py-4 cursor-pointer flex justify-between items-center transition-colors ${expandedCategory === categoryName ? 'bg-blue-50 border-b border-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => setExpandedCategory(expandedCategory === categoryName ? null : categoryName)}
                  >
                    <span className="font-extrabold text-gray-800 text-sm">{categoryName}</span>
                    <span className="text-xs font-bold bg-white text-blue-600 border border-blue-200 px-3 py-1 rounded-full shadow-sm">
                      {servicesInCategory.length} Services
                    </span>
                  </div>

                  {/* Services Inside the Category (Only shows if clicked) */}
                  {expandedCategory === categoryName && (
                    <div className="divide-y divide-gray-100 bg-white">
                      {servicesInCategory.map(service => (
                        <div key={service.service} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-1.5">
                              <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                ID: {service.service}
                              </span>
                              <p className="font-bold text-gray-900 text-sm leading-tight">{service.name}</p>
                            </div>
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              Cost: ₹{parseFloat(service.rate).toFixed(4)} / 1k
                            </p>
                          </div>
                          
                          <button 
                            onClick={() => handleMapService(service)} 
                            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                          >
                            Connect
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 DYNAMIC VISUAL MAPPING MODAL */}
      {mappingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMappingModal({ isOpen: false, providerId: null, providerName: null })}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Connect Service</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">Where do you want to link this provider's service?</p>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Selected Provider Service:</span>
                <span className="font-bold text-gray-900 text-sm leading-tight">{mappingModal.providerName}</span>
                <div className="mt-2 font-mono text-xs font-bold text-gray-500">ID: {mappingModal.providerId}</div>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Map to Wiizky Storefront:</p>
                
                {/* Dynamically generates a button for every service you have created! */}
                {settings?.prices && Object.keys(settings.prices).map(serviceKey => (
                  <button 
                    key={serviceKey}
                    onClick={() => saveMappingToDatabase(serviceKey)} 
                    className="w-full flex justify-between items-center p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <span className="font-bold text-gray-900 group-hover:text-blue-600 capitalize">
                      {serviceKey.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xl">👉</span>
                  </button>
                ))}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;