from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import stripe
import logging

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set your secret key. Remember to switch to your live secret key in production.
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    logger.info('Received request to create checkout session')
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': 100,  # $1.00
                        'product_data': {
                            'name': 'TalentLex AI Donation',
                            'description': 'Support TalentLex AI with a $1 donation',
                        },
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url='http://localhost:3000/success',
            cancel_url='http://localhost:3000/cancel',
        )

        logger.info('Checkout session created successfully')
        return jsonify({'sessionId': checkout_session.id})

    except Exception as e:
        logger.error(f'Error creating checkout session: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info('Starting the Flask server...')
    logger.info('Server is running on http://localhost:5000')
    app.run(port=5000, debug=True)