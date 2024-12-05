from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from supabase import create_client
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import threading
import time
import os
import pickle
from log_email_supabase_app import get_gmail_service, process_emails, get_user_email
from email.mime.multipart import MIMEMultipart
from google_auth_oauthlib.flow import InstalledAppFlow
from urllib.parse import urlparse, urlencode, parse_qs
from google.auth.transport.requests import Request
from datetime import datetime  # Add this import

# Only for development - remove in production!
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Supabase configuration
SUPABASE_URL = "https://atbphpeswwgqvwlbplko.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU"
# Initialize Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-Email"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

monitoring_active = False
monitoring_thread = None
current_user_email = None
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def check_token():
    """Check if token exists and is valid"""
    try:
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
                if creds and creds.valid:
                    return True
                if creds and creds.expired and creds.refresh_token:
                    try:
                        creds.refresh(Request())
                        with open('token.pickle', 'wb') as token:
                            pickle.dump(creds, token)
                        return True
                    except:
                        return False
        return False
    except Exception as e:
        print(f"Error checking token: {e}")
        return False
    
@app.route('/verify-email', methods=['GET'])
def verify_email():
    try:
        token = request.args.get('token')
        if not token:
            return 'Invalid verification link', 400

        # Verify token
        payload = jwt.decode(token, VERIFICATION_SECRET, algorithms=['HS256'])
        email = payload['email']

        # Update user's verification status in Supabase
        supabase.table('profiles')\
                .update({'verified': True})\
                .eq('email', email)\
                .execute()

        return '''
        <html>
            <body>
                <h1>Email Verified Successfully!</h1>
                <p>You can now close this window and return to TalentLex Search.</p>
                <script>
                    window.close();
                </script>
            </body>
        </html>
        '''

    except jwt.ExpiredSignatureError:
        return 'Verification link has expired', 400
    except jwt.InvalidTokenError:
        return 'Invalid verification link', 400
    except Exception as e:
        print(f"Error verifying email: {e}")
        return 'Verification failed', 500

@app.route('/auth/check', methods=['GET'])
async def check_auth():
    try:
        user_email = request.args.get('email') or request.headers.get('X-User-Email')
        print(f"Checking auth for email: {user_email}")
        
        # Get user's stored credentials
        result = supabase.table('profiles')\
                        .select('gmail_oauth_credentials')\
                        .eq('email', user_email)\
                        .single()\
                        .execute()

        print("Supabase result:", result.data)

        if not result.data or not result.data.get('gmail_oauth_credentials'):
            print("No credentials found")
            return jsonify({'authenticated': False}), 401

        creds_dict = result.data['gmail_oauth_credentials']
        print("Found credentials, starting email monitoring")

        # Start email monitoring if authenticated
        global monitoring_active, monitoring_thread, current_user_email
        current_user_email = user_email
        monitoring_active = True

        if not monitoring_thread or not monitoring_thread.is_alive():
            monitoring_thread = threading.Thread(target=monitor_emails)
            monitoring_thread.daemon = True
            monitoring_thread.start()
            print("Started monitoring thread")
        
        return jsonify({'authenticated': True}), 200
    except Exception as e:
        print(f"Auth check error: {e}")
        return jsonify({
            'authenticated': False,
            'error': str(e)
        }), 500

def handle_preflight():
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return response

@app.route('/auth/gmail', methods=['POST', 'OPTIONS'])
def gmail_auth():
    """Handle Gmail authentication"""
    print("Received Gmail auth request")
    
    if request.method == 'OPTIONS':
        return handle_preflight()

    try:
        print("Request content type:", request.content_type)
        print("Request data:", request.get_data())
        
        # Ensure we have JSON data
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Expected JSON data"
            }), 400

        data = request.get_json()
        print("Parsed JSON data:", data)

        user_email = data.get('email')
        if not user_email:
            return jsonify({
                "success": False,
                "error": "No email provided in request"
            }), 400

        print(f"Creating OAuth flow for {user_email}")
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials_boltmedia.json',
            SCOPES,
            redirect_uri='http://localhost:5001/oauth2callback'
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            prompt='consent',
            include_granted_scopes='true',
            state=user_email
        )
        
        print(f"Generated auth URL: {auth_url}")
        return jsonify({
            "success": True,
            "auth_url": auth_url
        })
        
    except Exception as e:
        print(f"Error in Gmail auth: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/oauth2callback')
def oauth2callback():
    try:
        print(f"Received callback at: {request.url}")
        
        # Get user email from query parameter
        user_email = request.args.get('state')  # Gets email from state parameter
        if not user_email:
            raise ValueError("No user email provided")

        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials_boltmedia.json',
            SCOPES,
            redirect_uri='http://localhost:5001/oauth2callback'
        )
        
        # Handle the callback
        flow.fetch_token(authorization_response=request.url)
        creds = flow.credentials

        # Convert credentials to a storable format
        creds_dict = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes,
            'expiry': creds.expiry.isoformat() if creds.expiry else None
        }

        # Only update gmail_oauth_credentials
        result = supabase.table('profiles')\
            .update({
                'gmail_oauth_credentials': creds_dict
            })\
            .eq('email', user_email)\
            .execute()

        return """
        <html>
            <body>
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to TalentLex Search.</p>
                <script>
                    if (window.opener) {
                        window.opener.postMessage('oauth-complete', 'http://localhost:3000');
                    }
                    setTimeout(() => window.close(), 2000);
                </script>
            </body>
        </html>
        """
    except Exception as e:
        print(f"Error in oauth2callback: {str(e)}")
        return f"Authentication failed: {str(e)}"

def monitor_emails():
    """Background thread function to monitor emails"""
    global monitoring_active, current_user_email
    print(f"\n=== Starting email monitoring for {current_user_email} ===")
    
    while monitoring_active:
        try:
            print("\n=== Checking for new emails ===")
            service, creds = get_gmail_service()
            process_emails(service, creds, current_user_email)
            print("=== Completed email check ===")
            
            print("Waiting 10 seconds before next check...")
            time.sleep(10)
            
        except Exception as e:
            print(f"⚠ Error in email monitoring: {str(e)}")
            print("Retrying in 5 seconds...")
            time.sleep(5)

    print(f"=== Email monitoring stopped for {current_user_email} ===")

@app.after_request
def add_security_headers(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    return response

if __name__ == '__main__':
    print("Starting Flask server on port 5001...")
    app.run(debug=True, port=5001, host='0.0.0.0')