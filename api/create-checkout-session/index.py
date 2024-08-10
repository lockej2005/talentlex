from http.server import BaseHTTPRequestHandler
import stripe
import os
import json

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

def create_checkout_session():
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
            success_url='https://talentlex.vercel.app/success',
            cancel_url='https://talentlex.vercel.app/cancel',
        )
        return {
            "statusCode": 200,
            "body": json.dumps({"sessionId": checkout_session.id})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        result = create_checkout_session()
        self.send_response(result["statusCode"])
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(result["body"].encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()