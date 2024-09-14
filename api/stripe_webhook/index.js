export const config = {
    api: {
      bodyParser: false,
    },
  };  

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Initialize Stripe and Supabase
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      // Construct the event from the raw request body and Stripe signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log the full event for visibility
    console.log('🔔 Event received:', event);

    // Handle the Stripe event
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Respond with 200 to acknowledge receipt of the event
    res.status(200).send('Event received');
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

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
