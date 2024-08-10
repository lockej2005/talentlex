import stripe
import os
import json
from http.server import BaseHTTPRequestHandler

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

def create_checkout_session(event):
    try:
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

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": json.dumps({
                "success": True,
                "sessionId": checkout_session.id
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": json.dumps({
                "success": False,
                "error": str(e)
            })
        }

def handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": ""
        }
    elif event.get('httpMethod') == 'POST':
        return create_checkout_session(event)
    else:
        return {
            "statusCode": 405,
            "body": "Method Not Allowed"
        }