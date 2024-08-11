from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json
from goodwin_prompt import goodwin_prompt
from white_and_case_prompt import white_and_case_prompt

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        application_text = data.get('applicationText')
        firm = data.get('firm')
        question = data.get('question')
        
        if not application_text or not firm or not question:
            self.send_error(400, "Missing required data")
            return

        if firm not in ["Goodwin", "White & Case"]:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "feedback": "Coming Soon... Only Goodwin and White & Case are active right now."
            })
            self.wfile.write(response.encode('utf-8'))
            return

        try:
            if firm == "Goodwin":
                system_prompt = goodwin_prompt
                model = "ft:gpt-4o-mini-2024-07-18:personal:4omini-v1:9u6vf9Ey"
            elif firm == "White & Case":
                system_prompt = white_and_case_prompt
                model = "gpt-4-0125-preview"

            user_prompt = f"""Firm: {firm}
            Question: {question}
            New application to be analyzed:

            {application_text}"""

            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
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