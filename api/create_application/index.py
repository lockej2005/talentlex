from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r') as file:
        return file.read()

# Read only the three specified prompts
sidley_austin_career_question = read_prompt('sidley_austin_career_question.txt')
goodwin_why_question = read_prompt('goodwin_why_question.txt')
default_prompt = read_prompt('default_prompt.txt')

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
        
        firm = data.get('firm')
        question = data.get('question')
        key_reasons = data.get('keyReasons')
        relevant_experience = data.get('relevantExperience')
        relevant_interaction = data.get('relevantInteraction')
        personal_info = data.get('personalInfo')
        
        if not firm or not question:
            self.send_error(400, "Missing required data")
            return

        try:
            # Select the appropriate prompt based on firm and question
            if firm == "Sidley Austin" and question == "Why does a career in commercial law and specifically Sidley Austin interest you? (250 words max)":
                system_prompt = sidley_austin_career_question
            elif firm == "Goodwin" and question == "Why are you applying to Goodwin? (100 words)":
                system_prompt = goodwin_why_question
            else:
                system_prompt = default_prompt

            model = "ft:gpt-4o-mini-2024-07-18:personal:appdrafterdataset:9vG3pVmA"

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

            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )

            generated_draft = completion.choices[0].message.content

            # Extract and format the usage information
            usage = {
                "prompt_tokens": completion.usage["prompt_tokens"],
                "completion_tokens": completion.usage["completion_tokens"],
                "total_tokens": completion.usage["total_tokens"]
            }

            self.send_response(200)
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "draft": generated_draft,
                "usage": usage  # Send back a simplified usage object
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))
