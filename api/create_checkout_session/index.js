const stripe = require('stripe')("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");
const { createClient } = require('@supabase/supabase-js');

// Ensure these environment variables are set in your Vercel project settings
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { priceId, userId } = req.body;

  // Get the origin from the request headers or use a default
  const origin = req.headers.origin || 'https://talentlex.app';

  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Error fetching user');
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating Supabase:', updateError);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/canceled`,
      metadata: {
        userId: userId
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
};