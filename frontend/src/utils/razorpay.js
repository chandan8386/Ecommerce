import { paymentApi } from '../api/services.js';
import { SITE_NAME } from './format.js';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const loadScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load Razorpay checkout. Check your connection.'));
    document.body.appendChild(s);
  });

/**
 * Opens the Razorpay checkout for a payment payload returned by the API and
 * verifies the result server-side.
 * Resolves with the verification result, rejects if the user dismisses or payment fails.
 * In mock mode (no Razorpay keys on the server, development only) the gateway is simulated.
 */
export async function payWithRazorpay(payment) {
  if (payment.mock) {
    const ok = window.confirm(
      `DEMO PAYMENT (Razorpay keys not configured)\n\nOrder ${payment.orderNumber}\nAmount: ₹${(payment.amount / 100).toLocaleString('en-IN')}\n\nClick OK to simulate a successful payment, Cancel to simulate failure.`
    );
    if (!ok) {
      await paymentApi.failed(payment.orderId, 'Payment cancelled by user').catch(() => {});
      throw new Error('Payment cancelled');
    }
    return paymentApi.verify({
      razorpay_order_id: payment.razorpayOrderId,
      razorpay_payment_id: `mock_pay_${Date.now()}`,
      razorpay_signature: 'mock_signature',
    });
  }

  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: SITE_NAME,
      description: `Order ${payment.orderNumber}`,
      order_id: payment.razorpayOrderId,
      prefill: payment.prefill,
      theme: { color: '#b8862b' },
      handler: async (response) => {
        try {
          resolve(await paymentApi.verify(response));
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: async () => {
          await paymentApi.failed(payment.orderId, 'Checkout closed').catch(() => {});
          reject(new Error('Payment cancelled'));
        },
      },
    });
    rzp.on('payment.failed', async (resp) => {
      await paymentApi.failed(payment.orderId, resp?.error?.description).catch(() => {});
      reject(new Error(resp?.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}
