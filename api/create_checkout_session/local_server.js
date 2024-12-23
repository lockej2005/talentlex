require('dotenv').config();

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
  console.log('Received request to create checkout session');
  console.log('Request body:', req.body);
  
  const { priceId, userId } = req.body;

  console.log(`Fetching user with ID: ${userId}`);
  // fetch the user from Supabase
  const { data: user, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return res.status(400).json({ error: 'Error fetching user' });
  }

  console.log('User data:', user);

  let customerId = user.stripe_customer_id;

  // if the user doesn't have a Stripe Customer ID, create one
  if (!customerId) {
    console.log('Creating new Stripe customer');
    const customer = await stripe.customers.create({
      metadata: {
        supabase_user_id: userId,
      },
    });
    customerId = customer.id;
    console.log('New Stripe customer created:', customerId);

    console.log('Updating Supabase with new Stripe customer ID');
    // update the user's Stripe Customer ID in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating Supabase:', error);
    } else {
      console.log('Supabase updated successfully');
    }
  }

  try {
    console.log('Creating Stripe checkout session');
    console.log('Checkout session parameters:', {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/canceled`,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/canceled`,
      metadata: {
        userId: userId
      }
    });

    console.log('Checkout session created:', session.id);
    res.json({ url: session.url });
  } catch (stripeError) {
    console.error('Stripe error:', stripeError);
    res.status(500).json({ error: 'Failed to create checkout session', details: stripeError.message });
  }
});

app.get('/api/verify_payment', async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      res.json({ paid: true, userId: session.metadata.userId });
    } else {
      res.json({ paid: false });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Set the port for the server to listen on
const PORT = process.env.PORT || 4000;

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