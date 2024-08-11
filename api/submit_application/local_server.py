import http.server
import socketserver
from openai import OpenAI
import os
import json
from goodwin_prompt import goodwin_prompt
from white_and_case_prompt import white_and_case_prompt
from jones_day_prompt import jones_day_prompt
from sidley_austin_prompt import sidley_austin_prompt
from dechert_prompt import dechert_prompt

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def set_CORS_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')

    def do_OPTIONS(self):
        self.send_response(200)
        self.set_CORS_headers()
        self.end_headers()

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

        if firm not in ["Goodwin", "White & Case", "Jones Day", "Sidley Austin", "Dechert"]:
            self.send_response(200)
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "feedback": "Coming Soon... Only Goodwin, White & Case, Jones Day, Sidley Austin, and Dechert are active right now."
            })
            self.wfile.write(response.encode('utf-8'))
            return

        try:
            if firm == "Goodwin":
                system_prompt = goodwin_prompt
                model = "ft:gpt-4-1106-preview:personal::8G69twhK"
            elif firm == "White & Case":
                system_prompt = white_and_case_prompt
                model = "gpt-4o"
            elif firm == "Jones Day":
                system_prompt = jones_day_prompt
                model = "gpt-4o"
            elif firm == "Sidley Austin":
                system_prompt = sidley_austin_prompt
                model = "gpt-4o"
            elif firm == "Dechert":
                system_prompt = dechert_prompt
                model = "gpt-4o"

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
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "feedback": ai_feedback
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()