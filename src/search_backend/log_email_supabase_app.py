import time
import pickle
import os.path
import base64
from bs4 import BeautifulSoup
from datetime import datetime
from supabase import create_client
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import uuid

# Configuration
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
SUPABASE_URL = "https://atbphpeswwgqvwlbplko.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBocGVzd3dncXZ3bGJwbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY2MDksImV4cCI6MjAzODg1MjYwOX0.Imv3PmtGs9pGt6MvrvscR6cuv6WWCXKsSvwTZGjF4xU"
CREDENTIALS_FILE = 'credentials_boltmedia.json'

# Initialize Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of approved email addresses (convert all to lowercase)
APPROVED_SENDERS = [
    'chai@talentlex.app'.lower(),  # Make sure this is lowercase
    'recruitment@cvmail.net'.lower(),
    'C.Prakash@lse.ac.uk'.lower(),
    # Add more email addresses here
]

def is_approved_sender(email_address):
    """Check if email is from an approved sender"""
    try:
        # Clean up email address if it's in "Name <email@domain.com>" format
        if '<' in email_address and '>' in email_address:
            email_address = email_address.split('<')[1].split('>')[0]
        
        cleaned_email = email_address.lower().strip()
        print(f"Checking email: {cleaned_email}")  # Debug log
        print(f"Approved senders: {APPROVED_SENDERS}")  # Debug log
        
        is_approved = cleaned_email in APPROVED_SENDERS
        print(f"Is approved: {is_approved}")  # Debug log
        return is_approved
    
    except Exception as e:
        print(f"Error checking sender email for {email_address}: {e}")
        return False

def get_gmail_service():
    """Authenticate and return Gmail service"""
    creds = None
    print("Starting Gmail authentication...")
    
    if os.path.exists('token.pickle'):
        print("Found existing token...")
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired token...")
            creds.refresh(Request())
        else:
            print("Getting new token...")
            if not os.path.exists(CREDENTIALS_FILE):
                raise FileNotFoundError(f"Missing {CREDENTIALS_FILE}. Please ensure it exists in the current directory.")
            
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
            print("Saved new token")
    
    print("Gmail authentication successful")
    return build('gmail', 'v1', credentials=creds), creds

def get_user_email(service):
    """Get the email address of the authenticated user"""
    try:
        profile = service.users().getProfile(userId='me').execute()
        return profile['emailAddress']
    except Exception as e:
        print(f"Error getting user email: {e}")
        return None

def extract_email_content(message):
    """Extract email content from Gmail message"""
    try:
        headers = message['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '')
        sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
        recipient = next((h['value'] for h in headers if h['name'].lower() == 'to'), '')
        
        # Extract body
        body = ""
        if 'parts' in message['payload']:
            for part in message['payload']['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body_data = part['body']['data']
                        body += base64.urlsafe_b64decode(body_data).decode('utf-8')
                elif part['mimeType'] == 'text/html':
                    if 'data' in part['body']:
                        body_data = part['body']['data']
                        html_body = base64.urlsafe_b64decode(body_data).decode('utf-8')
                        soup = BeautifulSoup(html_body, 'html.parser')
                        body += soup.get_text()
        else:
            if 'data' in message['payload']['body']:
                body_data = message['payload']['body']['data']
                body = base64.urlsafe_b64decode(body_data).decode('utf-8')

        return subject, sender, recipient, body.strip()
    except Exception as e:
        print(f"Error extracting email content: {e}")
        return '', '', '', ''

def store_email(message_id, subject, body, sender, recipient, user_email):
    """Store email in Supabase with error handling"""
    try:
        # Check if email is from approved sender
        if not is_approved_sender(sender):
            print(f"Skipping email from non-approved sender: {sender}")
            return False

        # Check if email already exists
        result = supabase.table('firm_email_logs')\
                        .select('id')\
                        .eq('subject', subject)\
                        .eq('firm_email', sender)\
                        .eq('recipient_email', user_email)\
                        .execute()
        
        if result.data:
            print(f"Email already exists in database: {subject}")
            return False

        # Get the user's profile ID based on their email
        profile_result = supabase.table('profiles')\
                                .select('id')\
                                .eq('email', user_email)\
                                .execute()
        
        if not profile_result.data:
            print(f"No profile found for email: {user_email}")
            return False

        user_id = profile_result.data[0]['id']
        
        # Store new email with authenticated user's email as recipient
        data = {
            'subject': subject,
            'body': body,
            'firm_email': sender,
            'recipient_email': user_email,  # This should be the authenticated user's email
            'created_at': datetime.now().isoformat(),
            'user_id': user_id,
            'user_name': user_email.split('@')[0],
            'message_id': message_id
        }
        
        print(f"Storing email for {user_email} from {sender}: {subject}")  # Debug log
        supabase.table('firm_email_logs').insert(data).execute()
        print(f"Successfully stored email")
        return True
        
    except Exception as e:
        print(f"Error storing email: {e}")
        return False

def process_emails(service, creds, user_email):
    """Process emails from approved senders"""
    try:
        print(f"\n=== Starting email scan for {user_email} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
        results = service.users().messages().list(
            userId='me',
            maxResults=50
        ).execute()
        
        messages = results.get('messages', [])
        if not messages:
            print("✓ No new messages found")
            return

        print(f"Found {len(messages)} messages to scan")
        processed_count = 0
        skipped_count = 0
        already_exists_count = 0
        
        for message in messages:
            try:
                msg = service.users().messages().get(userId='me', id=message['id']).execute()
                subject, sender, recipient, body = extract_email_content(msg)
                
                if not subject or not body:
                    print("⚠ Skipping email with missing content")
                    skipped_count += 1
                    continue
                
                # Extract sender email from the sender field
                sender_email = sender
                if '<' in sender and '>' in sender:
                    sender_email = sender.split('<')[1].split('>')[0]
                
                print(f"\n📧 Processing email from: {sender_email}")
                print(f"   Subject: {subject}")
                
                if is_approved_sender(sender_email):
                    print(f"✓ Approved sender: {sender_email}")
                    
                    # Try to store the email
                    storage_result = store_email(message['id'], subject, body, sender_email, recipient, user_email)
                    if storage_result:
                        processed_count += 1
                        print("✓ Successfully stored new email")
                    else:
                        already_exists_count += 1
                        print("ℹ Email already in database")
                else:
                    print(f"✗ Skipping - not an approved sender: {sender_email}")
                    skipped_count += 1
                
            except Exception as e:
                print(f"⚠ Error processing individual email: {e}")
                skipped_count += 1
                continue

        print(f"\n=== Email processing complete for {user_email} ===")
        print(f"✓ New emails stored: {processed_count}")
        print(f"ℹ Already existing: {already_exists_count}")
        print(f"⚠ Skipped: {skipped_count}")
        print(f"=== Next scan in 30 seconds ===\n")

    except Exception as e:
        print(f"⚠ Error in process_emails: {e}")