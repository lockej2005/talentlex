from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class ScoreRequest:
    def __init__(self, data):
        self.workexp_content = data.get('workexp_content', '')
        self.workexp_model = data.get('workexp_model', '')
        self.workexp_prompt = data.get('workexp_prompt', '')
        self.opentext_content = data.get('opentext_content', '')
        self.opentext_model = data.get('opentext_model', '')
        self.opentext_prompt = data.get('opentext_prompt', '')
        self.education_content = data.get('education_content', '')
        self.education_model = data.get('education_model', '')
        self.education_prompt = data.get('education_prompt', '')

def calculate_score(content, model, prompt, role_description):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": f"You are an AI expert in {role_description}. Your task is to rate the given content and provide a justification for your rating. {prompt} Provide your response in JSON format with the following structure: {{\"score\": (a number between 0 and 100), \"justification\": \"Your explanation here\"}}"},
                {"role": "user", "content": content}
            ],
            temperature=0.4,
            max_tokens=250,
            n=1,
            stop=None,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Error calculating score: {str(e)}")
        return {"error": f"Error calculating score: {str(e)}"}, 500

class handler(BaseHTTPRequestHandler):
    def set_CORS_headers(self):
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', 'http://localhost:3000')
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
        
        score_request = ScoreRequest(data)

        try:
            workexp_result = calculate_score(score_request.workexp_content, score_request.workexp_model, score_request.workexp_prompt, "evaluating work experience for job applications")
            education_result = calculate_score(score_request.education_content, score_request.education_model, score_request.education_prompt, "evaluating educational qualifications for job applications")
            opentext_result = calculate_score(score_request.opentext_content, score_request.opentext_model, score_request.opentext_prompt, "analyzing open-ended responses in job applications")

            if isinstance(workexp_result, tuple) or isinstance(education_result, tuple) or isinstance(opentext_result, tuple):
                self.send_error(500, "An error occurred during score calculation")
                return

            workexp_score = workexp_result['score']
            education_score = education_result['score']
            opentext_score = opentext_result['score']

            weighted_score = (workexp_score * 0.4) + (education_score * 0.3) + (opentext_score * 0.3)

            response_data = {
                "workexp": workexp_result,
                "education": education_result,
                "opentext": opentext_result,
                "weighted_score": weighted_score
            }

            self.send_response(200)
            self.set_CORS_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))