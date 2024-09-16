from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

def parse_openai_response(response_content):
    try:
        # First, try to parse the entire response as JSON
        return json.loads(response_content)
    except json.JSONDecodeError:
        # If that fails, try to extract JSON from the response
        try:
            json_start = response_content.index('{')
            json_end = response_content.rindex('}') + 1
            json_str = response_content[json_start:json_end]
            return json.loads(json_str)
        except (ValueError, json.JSONDecodeError):
            # If JSON extraction fails, return an error
            return {"error": "Failed to parse response", "raw_response": response_content}

def calculate_score(content, model, prompt, role_description):
    try:
        logger.info(f"Calculating score for {role_description}")
        logger.debug(f"Model: {model}")
        logger.debug(f"Prompt: {prompt}")
        logger.debug(f"Content: {content}")

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": f"You are an AI expert in {role_description}. Your task is to rate the given content and provide a justification for your rating. {prompt} Provide your response in JSON format with the following structure: {{\"score\": (a number between 0 and 100), \"justification\": \"Your explanation here, in STRICTLY 30 words or less\"}}"},
                {"role": "user", "content": content}
            ],
            temperature=0.4,
            max_tokens=250,
            n=1,
            stop=None,
        )
        raw_response = response.choices[0].message.content.strip()
        logger.debug(f"Raw API response: {raw_response}")

        parsed_response = parse_openai_response(raw_response)
        if 'error' in parsed_response:
            logger.error(f"Error parsing API response: {parsed_response['error']}")
            return {"error": f"Error parsing API response: {parsed_response['error']}", "raw_response": raw_response}
        
        logger.info(f"Score calculated successfully for {role_description}")
        return parsed_response
    except Exception as e:
        logger.error(f"Error calculating score: {str(e)}")
        return {"error": f"Error calculating score: {str(e)}"}

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
        
        score_request = ScoreRequest(data)

        try:
            workexp_result = calculate_score(score_request.workexp_content, score_request.workexp_model, score_request.workexp_prompt, "evaluating work experience for job applications")
            education_result = calculate_score(score_request.education_content, score_request.education_model, score_request.education_prompt, "evaluating educational qualifications for job applications")
            opentext_result = calculate_score(score_request.opentext_content, score_request.opentext_model, score_request.opentext_prompt, "analyzing open-ended responses in job applications")

            errors = []
            if 'error' in workexp_result:
                errors.append(f"Work Experience: {workexp_result['error']}")
            if 'error' in education_result:
                errors.append(f"Education: {education_result['error']}")
            if 'error' in opentext_result:
                errors.append(f"Open Text: {opentext_result['error']}")

            if errors:
                error_message = '; '.join(errors)
                logger.error(f"Errors occurred during score calculation: {error_message}")
                self.send_error(500, f"Errors occurred during score calculation: {error_message}")
                return

            workexp_score = workexp_result.get('score', 0)
            education_score = education_result.get('score', 0)
            opentext_score = opentext_result.get('score', 0)

            weighted_score = (workexp_score * 0.2) + (education_score * 0.2) + (opentext_score * 0.6)

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
            logger.error(f"Unexpected error: {str(e)}")
            self.send_error(500, str(e))