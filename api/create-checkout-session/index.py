from http.server import BaseHTTPRequestHandler
import stripe
import os
import json

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Create Stripe checkout session
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

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "sessionId": checkout_session.id
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()