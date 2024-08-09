from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        application_text = data.get('applicationText')
        
        if not application_text:
            self.send_error(400, "No application text provided")
            return

        try:
            completion = client.chat.completions.create(
                model="ft:gpt-4o-mini-2024-07-18:personal:4omini-v1:9u6vf9Ey",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that provides feedback on job applications."},
                    {"role": "user", "content": f"New application to be analyzed:\n\n{application_text}"}
                ]
            )

            ai_feedback = completion.choices[0].message.content

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "feedback": ai_feedback
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