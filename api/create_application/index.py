#EXAMPLE OF RANDOM ENDPOINT THAT WORKS ON VERCEL SERVERLESS FUNCTION
import json
import os
from openai import OpenAI
from http.server import BaseHTTPRequestHandler

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r', encoding='utf-8') as file:
        return file.read()

# Read only the three specified prompts
sidley_austin_career_question = read_prompt('sidley_austin_career_question.txt')
goodwin_why_question = read_prompt('goodwin_why_question.txt')
jones_day_prompt = read_prompt('jones_day_prompt.txt')
default_prompt = read_prompt('default_prompt.txt')

class handler(BaseHTTPRequestHandler):
    def set_CORS_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    
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

        if firm == "Jones Day":
            why_law = data.get('whyLaw')
            why_jones_day = data.get('whyJonesDay')
            why_you = data.get('whyYou')
            relevant_experiences = data.get('relevantExperiences')
        else:
            key_reasons = data.get('keyReasons')
            relevant_experience = data.get('relevantExperience')
            relevant_interaction = data.get('relevantInteraction')
            personal_info = data.get('personalInfo')

        if not firm or not question:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({"error": "Missing required data"})
            self.wfile.write(response.encode('utf-8'))
            return

        try:
            # Select the appropriate prompt based on firm and question
            if firm == "Sidley Austin" and question == "Why does a career in commercial law and specifically Sidley Austin interest you? (250 words max)":
                system_prompt = sidley_austin_career_question
                base_model="gpt-4o-mini"   
            elif firm == "Goodwin" and question == "Why are you applying to Goodwin? (100 words)":
                system_prompt = goodwin_why_question
                base_model = "ft:gpt-4o-mini-2024-07-18:personal:appdrafterdataset:9vG3pVmA"
            elif firm == "Jones Day":
                system_prompt = jones_day_prompt
                base_model = "ft:gpt-4o-2024-08-06:personal:jonesdaydrafter:9zJFj48D"
            else:
                system_prompt = default_prompt
                base_model="gpt-4o-mini"   

            model = base_model

            if firm == "Jones Day":
                prompt = f"""
                Generate a draft application for Jones Day addressing the following question:
                "{question}"

                Include the following information in your response:
                - Why law: {why_law}
                - Why Jones Day: {why_jones_day}
                - Why you: {why_you}
                - Relevant experiences: {relevant_experiences}

                Please create a well-structured, professional application that incorporates all the provided information seamlessly.
                """
            else:
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
            usage = completion.usage

            self.send_response(200)
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({
                "success": True,
                "draft": generated_draft,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                }
            })
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({"error": str(e)})
            self.wfile.write(response.encode('utf-8'))