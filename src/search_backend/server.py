from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
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

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "https://dev.talentlex.app/",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
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

@app.route('/auth/check', methods=['GET'])
async def check_auth():
    try:
        # Get user's stored credentials
        result = supabase.table('profiles')\
                        .select('gmail_oauth_credentials')\
                        .eq('email', current_user_email)\
                        .single()\
                        .execute()

        if not result.data or not result.data.get('gmail_oauth_credentials'):
            return False

        creds_dict = result.data['gmail_oauth_credentials']
        
        # Create Credentials object
        creds = Credentials(
            token=creds_dict['token'],
            refresh_token=creds_dict['refresh_token'],
            token_uri=creds_dict['token_uri'],
            client_id=creds_dict['client_id'],
            client_secret=creds_dict['client_secret'],
            scopes=creds_dict['scopes']
        )

        # Check if credentials need refresh
        if creds.expired:
            creds.refresh(Request())
            # Update stored credentials
            creds_dict = {
                'token': creds.token,
                'refresh_token': creds.refresh_token,
                'token_uri': creds.token_uri,
                'client_id': creds.client_id,
                'client_secret': creds.client_secret,
                'scopes': creds.scopes
            }
            
            supabase.table('profiles')\
                    .update({'gmail_oauth_credentials': creds_dict})\
                    .eq('email', current_user_email)\
                    .execute()

        return True
    except Exception as e:
        print(f"Auth check error: {e}")
        return False

@app.route('/auth/gmail', methods=['POST', 'OPTIONS'])
def gmail_auth():
    """Handle Gmail authentication"""
    print("Received Gmail auth request")
    
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response

    try:
        print("Creating OAuth flow")
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials_boltmedia.json',
            SCOPES,
            redirect_uri='http://localhost:5001/oauth2callback'
        )
        
        auth_url, _ = flow.authorization_url(access_type='offline')
        print(f"Generated auth URL: {auth_url}")
        
        response = make_response(jsonify({
            "success": True,
            "auth_url": auth_url
        }))
        return response
        
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
        
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials_boltmedia.json',
            SCOPES,
            redirect_uri='your_production_url/oauth2callback'
        )
        
        authorization_response = request.url
        if authorization_response.startswith('http:'):
            authorization_response = 'https://' + authorization_response[7:]
        
        # Exchange code for credentials
        flow.fetch_token(authorization_response=authorization_response)
        creds = flow.credentials

        # Convert credentials to a storable format
        creds_dict = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes
        }

        # Store in Supabase
        supabase.table('profiles')\
                .update({'gmail_oauth_credentials': creds_dict})\
                .eq('email', current_user_email)\
                .execute()

        return """
        <html>
            <body>
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to TalentLex Search.</p>
                <script>
                    if (window.opener) {
                        window.opener.postMessage('oauth-complete', 'https://your-production-domain.com');
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
            if check_token():
                print(f"\n=== Starting email monitoring cycle at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
                service, creds = get_gmail_service()
                process_emails(service, creds, current_user_email)
            else:
                print("⚠ Token invalid or expired. Waiting for next cycle...")
            
            print(f"Waiting 10 seconds before next check...")
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