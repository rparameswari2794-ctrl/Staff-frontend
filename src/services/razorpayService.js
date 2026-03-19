// src/services/razorpayService.js
import api from './api';

// Load Razorpay script with timeout and retry
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if script already loaded
    if (window.Razorpay) {
      console.log('Razorpay script already loaded');
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };

    // Set timeout for script loading
    const timeout = setTimeout(() => {
      console.error('Razorpay script loading timed out');
      resolve(false);
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    document.body.appendChild(script);
  });
};

// Get Razorpay key from backend
export const getRazorpayKey = async () => {
  try {
    const response = await api.get('/get-razorpay-key/');
    return response.data.key_id;
  } catch (error) {
    console.error('Error getting Razorpay key:', error);
    throw error;
  }
};

// Create order on backend
export const createOrder = async (amount, notes = {}) => {
  try {
    const response = await api.post('/create-razorpay-order/', {
      amount: amount,
      currency: 'INR',
      notes: notes
    });
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Initialize Razorpay payment
export const initializePayment = async ({
  amount,
  orderId,
  keyId,
  name,
  description,
  prefill,
  notes,
  callback
}) => {
  try {
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      callback({ success: false, error: 'Razorpay SDK failed to load. Please check your internet connection.' });
      return;
    }

    // Check if Razorpay is available
    if (!window.Razorpay) {
      callback({ success: false, error: 'Razorpay SDK not available' });
      return;
    }

    const options = {
      key: keyId,
      amount: amount,
      currency: 'INR',
      name: name || 'Fresh Super Market',
      description: description || 'Payment',
      order_id: orderId,
      handler: function(response) {
        callback({
          success: true,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        });
      },
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || ''
      },
      notes: notes,
      theme: {
        color: '#28a745'
      },
      modal: {
        ondismiss: function() {
          callback({ success: false, error: 'Payment cancelled' });
        },
        // Handle connection errors
        onerror: function(error) {
          console.error('Razorpay modal error:', error);
          callback({ success: false, error: 'Payment failed due to connection error' });
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error initializing payment:', error);
    callback({ success: false, error: error.message || 'Failed to initialize payment' });
  }
};

// Verify payment on backend
export const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post('/verify-razorpay-payment/', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};