import React, { useState } from 'react';

// Securely loads the Razorpay script into your browser
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const OrderForm = ({ user }) => {
  const [service, setService] = useState('followers');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState(100);

  // Live Price Editor State
  const [prices, setPrices] = useState({ followers: 80, likes: 40, views: 10 });
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editValue, setEditValue] = useState(0);

  // Fetch real prices from Database when page loads
  React.useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/orders/admin/settings');
        const data = await res.json();
        if (data.success && data.settings && data.settings.prices) {
          setPrices(data.settings.prices);
        }
      } catch (error) { console.error("Could not fetch database prices."); }
    };
    fetchPrices();
  }, []);

  // Save the new price to the Database
  const handleSavePrice = async () => {
    const updatedPrices = { ...prices, [service]: Number(editValue) };
    try {
      const res = await fetch('http://localhost:5000/api/orders/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: updatedPrices })
      });
      const data = await res.json();
      if (data.success) {
        setPrices(updatedPrices);
        setIsEditingPrice(false);
      } else { alert("Failed to save price!"); }
    } catch (error) { alert("Network error saving price."); }
  };
  
  // Let this line replace your old hardcoded prices!
  const currentPrice = ((prices[service] / 1000) * quantity).toFixed(2);
  
  const [showModal, setShowModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!link.includes('instagram.com')) return alert("Please enter a valid Instagram link.");
    setIsProcessing(true);
    
    try {
      // 1. Load Razorpay
      const res = await loadRazorpay();
      if (!res) {
        setIsProcessing(false);
        return alert("Razorpay failed to load. Are you online?");
      }

      // 2. Ask backend for a bill
      const paymentRes = await fetch('http://localhost:5000/api/orders/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: currentPrice })
      });
      const paymentData = await paymentRes.json();

      if (!paymentData.success) {
        setIsProcessing(false);
        return alert("Failed to initialize payment.");
      }

      // 3. Open Razorpay Window
      const options = {
        key: "rzp_live_SDzkrPrOp9RiDs", // 🚨 PASTE YOUR rzp_test KEY HERE!
        amount: paymentData.order.amount,
        currency: "INR",
        name: "Wiizky Social Media",
        description: `Order: ${quantity} ${service}`,
        order_id: paymentData.order.id, 
        handler: async function (response) {
          // 4. PAYMENT SUCCESS! Now trigger the actual SMM order!
          try {
            const saveRes = await fetch('http://localhost:5000/api/orders/new', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user._id, 
                serviceType: service,
                instagramLink: link,
                quantity: quantity,
                pricePaid: currentPrice
              })
            });

            const data = await saveRes.json();
            if (data.success) {
              setOrderDetails(data.order);
              setShowModal(true);
              setLink(''); 
            } else {
              alert("Payment succeeded but order failed. Contact Admin.");
            }
          } catch (error) {
            console.error("Order save failed:", error);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "customer@wiizky.com",
          contact: "9999999999"
        },
        theme: { color: "#2563EB" },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Failed! Reason: " + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error) {
      console.error("Payment flow crashed:", error);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-md p-8 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex justify-between items-center tracking-tight">
          New Order
          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shadow-sm">Instant Delivery</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Service</label>
            <select 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium capitalize" 
              value={service} 
              onChange={(e) => setService(e.target.value)}
            >
              {Object.keys(prices).map(serviceKey => (
                <option key={serviceKey} value={serviceKey}>
                  {/* Formats text nicely: "telegram_views" -> "Telegram Views" */}
                  {serviceKey.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Instagram Link</label>
            <input type="url" required placeholder="https://instagram.com/yourusername" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium placeholder-gray-400" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Quantity: {quantity.toLocaleString()}</label>
            <input type="range" min="100" max="10000" step="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            <div className="flex justify-between text-xs font-bold text-gray-400 mt-2"><span>100</span><span>10,000</span></div>
          </div>

          <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 flex justify-between items-center mt-6 shadow-inner relative">
            <span className="text-gray-600 font-bold">Total Price</span>

            {/* If Admin clicks Pencil, show the input box */}
            {isEditingPrice ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                <span className="text-xs font-bold text-gray-500">Rate per 1k: ₹</span>
                <input
                  type="number"
                  className="w-16 px-2 py-1 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <button type="button" onClick={handleSavePrice} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors">
                  Save
                </button>
                <button type="button" onClick={() => setIsEditingPrice(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  X
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-gray-900">₹{currentPrice}</span>

                {/* Show Pencil ONLY if the user is an Admin */}
                {(user?.role === 'admin' || user?.name === 'admin' || user?.email?.includes('admin')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditValue(prices[service]); // Set input to current rate (e.g. 80)
                      setIsEditingPrice(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    title="Edit Base Price per 1000"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          <button type="submit" disabled={isProcessing} className={`w-full py-4 mt-2 rounded-xl font-bold text-white transition-all duration-300 ${isProcessing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-[0_8px_20px_rgba(37,99,235,0.3)]'}`}>
            {isProcessing ? 'Connecting Gateway...' : 'Pay Securely'}
          </button>
        </form>
      </div>

      {showModal && orderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-xl border border-white p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl transform transition-all">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200 shadow-sm">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-1 tracking-tight">Order Placed!</h3>
            <p className="text-gray-500 text-center text-sm font-medium mb-8">Your payment was successful.</p>
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4 mb-8 border border-gray-100 shadow-inner">
              <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold">Order ID:</span><span className="text-blue-600 font-mono font-bold">{orderDetails.internalOrderId}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold">Service:</span><span className="text-gray-900 font-bold capitalize">{orderDetails.serviceType}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold">Quantity:</span><span className="text-gray-900 font-bold">{orderDetails.quantity.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm pt-4 border-t border-gray-200 mt-4"><span className="text-gray-500 font-bold">Amount Paid:</span><span className="text-gray-900 font-black text-lg">₹{orderDetails.pricePaid}</span></div>
            </div>
            <button onClick={() => { setShowModal(false); setOrderDetails(null); }} className="w-full py-4 rounded-xl font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200">Done</button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderForm;