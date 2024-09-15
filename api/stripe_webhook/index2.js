const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve the Stripe Customer ID from the session
    const stripeCustomerId = session.customer;

    // Fetch the user from your database using the Stripe Customer ID
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(400).send(`Error fetching user: ${error.message}`);
    }

    if (!user) {
      console.error('User not found');
      return res.status(400).send('User not found');
    }

    // Update the user's hasPlus status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ hasPlus: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(400).send(`Error updating user: ${updateError.message}`);
    }

    console.log(`Updated hasPlus status for user ${user.id}`);
  }

  res.json({received: true});
});

module.exports = app;