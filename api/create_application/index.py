import json
import os
from openai import OpenAI
from http.server import BaseHTTPRequestHandler

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

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

        print("Received data:", json.dumps(data, indent=2))  # Log received data

        firmName = data.get('firmName')
        question = data.get('question')
        system_prompt = data.get('system_prompt')
        model = data.get('model')
        importedDraft = data.get('importedDraft', '')  # Get the imported draft, default to empty string

        if not all([firmName, question, system_prompt, model]):
            self.send_error_response(400, f"Missing required data. firmName: {firmName}, question: {question}, system_prompt: {system_prompt}, model: {model}")
            return

        try:
            if firmName == "Jones Day":
                prompt = f"""
                Generate a draft application for Jones Day addressing the following question:
                "{question}"

                Include the following information in your response:
                - Why law: {data.get('whyLaw')}
                - Why Jones Day: {data.get('whyJonesDay')}
                - Why you: {data.get('whyYou')}
                - Relevant experiences: {data.get('relevantExperiences')}

                Please create a well-structured, professional application that incorporates all the provided information seamlessly.

                If applicable, use the following imported draft as a reference or starting point:
                {importedDraft}
                """
            else:
                prompt = f"""
                Generate a draft application for {firmName} addressing the following question:
                "{question}"

                Include the following information in your response:
                - Key reason(s) for applying: {data.get('keyReasons')}
                - Relevant experience: {data.get('relevantExperience')}
                - Relevant interaction with the firm: {data.get('relevantInteraction')}
                - Additional personal information: {data.get('personalInfo')}

                Please create a well-structured, professional application that incorporates all the provided information seamlessly.

                If applicable, use the following imported draft as a reference or starting point:
                {importedDraft}
                """

            print(f"Using model: {model}")
            print(f"System prompt: {system_prompt}")
            print(f"User prompt: {prompt}")

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
            print(f"Error occurred: {str(e)}")
            self.send_error_response(500, f"Internal server error: {str(e)}")

    def send_error_response(self, status_code, message):
        self.send_response(status_code)
        self.set_CORS_headers()
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = json.dumps({"error": message})
        self.wfile.write(response.encode('utf-8'))