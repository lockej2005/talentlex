const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = req.query;

  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error('Error fetching user');
    }

    if (!user.stripe_customer_id) {
      return res.status(404).json({ error: 'User has no associated Stripe customer' });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 10,
    });

    const paymentHistory = invoices.data.map(invoice => ({
      id: invoice.id,
      date: invoice.created * 1000,
      amount: `${(invoice.total / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`,
      status: invoice.status,
    }));

    res.status(200).json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};