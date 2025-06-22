import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

interface StripePaymentProps {
  paymentIntentId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const StripePayment: React.FC<StripePaymentProps> = ({
  paymentIntentId,
  amount,
  onError
}) => {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripeConfig = await chrome.storage.sync.get(['stripePublishableKey']);
        const publishableKey = stripeConfig.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY;
        
        if (!publishableKey) {
          onError('Stripe not configured');
          return;
        }

        const stripeInstance = await loadStripe(publishableKey);
        setStripe(stripeInstance);
      } catch (error) {
        onError('Failed to load Stripe');
      }
    };

    initStripe();
  }, [onError]);

  // Payment handling would be implemented with Stripe Elements
  // For now, we redirect to a secure checkout page

  const openStripeCheckout = () => {
    // Open Stripe Checkout in new tab for security
    chrome.tabs.create({
      url: `chrome-extension://${chrome.runtime.id}/stripe-checkout.html?payment_intent=${paymentIntentId}`
    });
  };

  return (
    <div className="stripe-payment">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Complete Your Purchase</h3>
        <p className="text-gray-600">Pay ${amount.toFixed(2)} to get your discounted item!</p>
      </div>
      
      <button
        onClick={openStripeCheckout}
        disabled={!stripe}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        Pay with Stripe
      </button>
    </div>
  );
};