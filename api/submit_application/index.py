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
        
        application_text = data.get('applicationText')
        firm = data.get('firm')
        question = data.get('question')
        work_experience = data.get('work_experience', '')
        education = data.get('education', '')
        sub_category = data.get('sub_category', '')
        system_prompt = data.get('system_prompt')
        model = data.get('model')
        
        if not all([application_text, firm, question, system_prompt, model]):
            self.send_error(400, "Missing required data")
            return

        try:
            user_prompt = f"""Firm: {firm}
            Question: {question}
            Application decision:
            This application was rejected.

            Open-Text Question:
            {application_text}

            Work Experience:
            {work_experience}

            Education:
            This applicant studied at {education} for a {sub_category}.
            """

            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )

            ai_feedback = completion.choices[0].message.content

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
                "usage": usage,
                "model": model,
                "system_prompt": system_prompt,
                "user_prompt": user_prompt
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))