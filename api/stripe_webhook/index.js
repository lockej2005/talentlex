const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionEvent(subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

const buffer = async (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
};

const handleSubscriptionEvent = async (subscription) => {
  try {
    const customerId = subscription.customer;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error) {
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