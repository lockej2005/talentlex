from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class handler(BaseHTTPRequestHandler):
    def set_CORS_headers(self):
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    def do_OPTIONS(self):
        self.send_response(200)
        self.set_CORS_headers()
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))

        scenario = data.get('scenario')
        conversation_history = data.get('conversation_history', [])
        user_offer = data.get('user_offer')

        if not scenario or not user_offer:
            self.send_error(400, "Missing required data")
            return

        try:
            messages = [
                {"role": "system", "content": "You are a decision-making agent for the opposing lawyer. Based on the negotiation history and the user's final offer, you need to decide whether to accept or reject the offer. Respond with a JSON object containing 'decision' (either 'accepted' or 'rejected') and 'justification' fields."},
                {"role": "user", "content": f"Scenario: {scenario}\n\nConversation History:\n" + "\n".join([f"{'User' if r['side'] == 'user' else 'Opposition'}: {r['content']}" for r in conversation_history]) + f"\n\nUser's Final Offer:\n{json.dumps(user_offer, indent=2)}"}
            ]

            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=300,
                temperature=0.7,
                response_format={"type": "json_object"}
            )

            result = json.loads(completion.choices[0].message.content)

            self.send_response(200)
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps(result)
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))