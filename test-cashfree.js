import cashfree from './config/cashfree.js';
import dotenv from 'dotenv';

dotenv.config();

const testCashfreeCredentials = async () => {
  try {
    const response = await cashfree.createOrder({
      orderId: "test-order-" + Date.now(),
      orderAmount: 1,
      orderCurrency: "INR",
      customerDetails: {
        customerId: "test-customer-id",
        customerEmail: "test@example.com",
        customerPhone: "9999999999"
      },
      orderMeta: {
        returnUrl: "https://example.com/return",
        notifyUrl: "https://example.com/notify"
      }
    });
    console.log('Test successful:', response);
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testCashfreeCredentials();