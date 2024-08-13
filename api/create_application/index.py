from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r') as file:
        return file.read()

goodwin_draft = read_prompt('goodwin_draft.txt')
system_prompt = goodwin_draft

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))

        firm = body.get('firm')
        question = body.get('question')
        key_reasons = body.get('keyReasons')
        relevant_experience = body.get('relevantExperience')
        relevant_interaction = body.get('relevantInteraction')
        personal_info = body.get('personalInfo')

        if not firm or not question:
            self.send_error(400, "Missing required data")
            return

        prompt = f"""
        Generate a draft application for {firm} addressing the following question:
        "{question}"

        Include the following information in your response:
        - Key reason(s) for applying: {key_reasons}
        - Relevant experience: {relevant_experience}
        - Relevant interaction with the firm: {relevant_interaction}
        - Additional personal information: {personal_info}

        Please create a well-structured, professional application that incorporates all the provided information seamlessly.
        """

        try:
            completion = client.chat.completions.create(
                model="ft:gpt-4o-mini-2024-07-18:personal:appdrafterdataset:9vG3pVmA",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )

            generated_draft = completion.choices[0].message.content

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps({
                'success': True,
                'draft': generated_draft
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

def handler(event, context):
    return Handler.handler(event, context)