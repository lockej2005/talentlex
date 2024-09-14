require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const cors = require('cors'); // Import cors middleware

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enable CORS for all routes
app.use(cors());

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Health Check Endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested.');
  res.status(200).send('Server is healthy!');
});

// Stripe Webhook Endpoint
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log the full event to console
  console.log('🔔 Event received:', event);

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('Customer subscription created:', event.data.object);
      await handleSubscriptionEvent(event.data.object);
      break;
    case 'customer.subscription.updated':
      console.log('Customer subscription updated:', event.data.object);
      await handleSubscriptionEvent(event.data.object);
      break;
    case 'customer.subscription.deleted':
      console.log('Customer subscription deleted:', event.data.object);
      await handleSubscriptionEvent(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// Handle subscription event logic
const handleSubscriptionEvent = async (subscription) => {
  try {
    const customerId = subscription.customer;

    // Fetch the customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId);

    // Try to find the user by Stripe customer ID first
    let { data, error } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, email')
      .eq('stripe_customer_id', customerId)
      .single();

    // If not found by Stripe customer ID, try to find by email
    if (error || !data) {
      ({ data, error } = await supabase
        .from('profiles')
        .select('id, stripe_customer_id, email')
        .eq('email', customer.email)
        .single());

      // If found by email but Stripe customer ID is not set, update it
      if (data && !data.stripe_customer_id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', data.id);

        if (updateError) {
          console.error('Error updating Stripe customer ID:', updateError);
        } else {
          console.log(`Updated Stripe customer ID for user ${data.id}`);
        }
      }
    }

    if (error || !data) {
      console.error('Error fetching user profile:', error);
      return;
    }

    const userId = data.id;

    let hasPlus = false;

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      hasPlus = true;
    } else if (subscription.status === 'canceled' || subscription.status === 'past_due') {
      hasPlus = false;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ hasPlus })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
    } else {
      console.log(`Updated user ${userId} hasPlus to ${hasPlus}`);
    }
  } catch (err) {
    console.error('Error handling subscription event:', err);
  }
};

// Start server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
