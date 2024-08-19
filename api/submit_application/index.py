from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r') as file:
        return file.read()

# Read prompts
goodwin_prompt = read_prompt('goodwin_prompt.txt')
white_and_case_prompt = read_prompt('white_and_case_prompt.txt')
jones_day_prompt = read_prompt('jones_day_prompt.txt')
sidley_austin_prompt = read_prompt('sidley_austin_prompt.txt')
dechert_prompt = read_prompt('dechert_prompt.txt')

# Additional Sidley Austin specific prompts
why_career_sidley_austin_prompt = read_prompt('why_career_sidley_austin_prompt.txt')
commercial_issue_prompt = read_prompt('commercial_issue_prompt.txt')
personal_qualities_prompt = read_prompt('personal_qualities_prompt.txt')

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
                model = "gpt-4o"
            elif firm == "White & Case":
                system_prompt = white_and_case_prompt
                model = "gpt-4o"
            elif firm == "Jones Day":
                system_prompt = jones_day_prompt
                model = "gpt-4o"
            elif firm == "Sidley Austin":
                # Use specific prompts based on the question
                if question == "Why does a career in commercial law and specifically Sidley Austin interest you? (250 words max)":
                    system_prompt = why_career_sidley_austin_prompt
                elif question == "Describe a current commercial issue that has interested you and explain why it interested you? (250 words max)":
                    system_prompt = commercial_issue_prompt
                elif question == "In your view which personal qualities make a successful lawyer? (250 words max)":
                    system_prompt = personal_qualities_prompt
                else:
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

            # Extract and format the usage information
            usage = {
                "prompt_tokens": completion.usage.prompt_tokens,
                "completion_tokens": completion.usage.completion_tokens,
                "total_tokens": completion.usage.total_tokens
            }

            self.send_response(200)
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "feedback": ai_feedback,
                "usage": usage  # Send back a simplified usage object
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))
