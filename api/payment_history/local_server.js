require('dotenv').config();

const express = require('express');
const stripe = require('stripe')("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");
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

console.log('Starting server initialization...');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('Supabase client created');

// Enable CORS for all origins
app.use(cors());
console.log('CORS enabled for all origins');

app.use(express.json());
console.log('JSON body parser enabled');

app.post('/api/create_checkout_session', async (req, res) => {
  // ... (existing code remains the same)
});

app.get('/api/verify_payment', async (req, res) => {
  // ... (existing code remains the same)
});

// New endpoint for fetching payment history
app.get('/api/payment_history', async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch the user's Stripe customer ID from Supabase
    const { data: user, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(400).json({ error: 'Error fetching user' });
    }

    if (!user.stripe_customer_id) {
      return res.status(404).json({ error: 'User has no associated Stripe customer' });
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 10, // Adjust this number as needed
    });

    // Format the invoice data
    const paymentHistory = invoices.data.map(invoice => ({
      id: invoice.id,
      date: invoice.created * 1000, // Convert to milliseconds
      amount: `${(invoice.total / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
      status: invoice.status,
    }));

    res.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Set the port for the server to listen on
const PORT = process.env.PORT || 4001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment variables:');
  console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});