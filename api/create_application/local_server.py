from flask import Flask, request, jsonify
from openai import OpenAI
from flask_cors import CORS
import os
import json
import logging

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(level=logging.DEBUG,  # Set to DEBUG for extensive logging
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def read_prompt(filename):
    logger.debug(f"Reading prompt from file: {filename}")
    try:
        with open(os.path.join(os.path.dirname(__file__), filename), 'r', encoding='utf-8') as file:
            content = file.read()
            logger.debug(f"Successfully read prompt from {filename}")
            return content
    except Exception as e:
        logger.error(f"Failed to read prompt from {filename}: {e}")
        raise

# Read only the three specified prompts
sidley_austin_career_question = read_prompt('sidley_austin_career_question.txt')
goodwin_why_question = read_prompt('goodwin_why_question.txt')
default_prompt = read_prompt('default_prompt.txt')

@app.route('/create_application', methods=['POST', 'OPTIONS'])
def generate_draft():
    if request.method == 'OPTIONS':
        logger.info("Handling preflight OPTIONS request")
        return _build_cors_preflight_response()

    logger.info("Received request to generate draft")
    
    data = request.json
    logger.debug(f"Request data: {data}")
    
    firm = data.get('firm')
    question = data.get('question')
    key_reasons = data.get('keyReasons')
    relevant_experience = data.get('relevantExperience')
    relevant_interaction = data.get('relevantInteraction')
    personal_info = data.get('personalInfo')
    
    if not firm or not question:
        logger.warning("Missing required data: firm or question not provided")
        return jsonify({"error": "Missing required data"}), 400

    try:
        # Select the appropriate prompt based on firm and question
        logger.debug(f"Selecting system prompt for firm: {firm}, question: {question}")
        if firm == "Sidley Austin" and question == "Why does a career in commercial law and specifically Sidley Austin interest you? (250 words max)":
            system_prompt = sidley_austin_career_question
        elif firm == "Goodwin" and question == "Why are you applying to Goodwin? (100 words)":
            system_prompt = goodwin_why_question
        else:
            system_prompt = default_prompt

        model = "ft:gpt-4o-mini-2024-07-18:personal:appdrafterdataset:9vG3pVmA"
        logger.debug(f"Using model: {model}")

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

        logger.info("Sending request to OpenAI API")
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        logger.info("Received response from OpenAI API")

        # Log the full response from OpenAI
        logger.debug(f"Full response from OpenAI: {completion}")

        generated_draft = completion.choices[0].message.content
        usage = completion.usage  # Access the usage object directly

        logger.debug(f"Generated draft: {generated_draft}")
        logger.debug(f"Usage details: {usage}")

        return _corsify_actual_response(jsonify({
            "success": True,
            "draft": generated_draft,
            "usage": {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens
            }
        }))

    except Exception as e:
        logger.error(f"An error occurred during draft generation: {e}")
        return _corsify_actual_response(jsonify({"error": str(e)}), 500)

def _build_cors_preflight_response():
    response = jsonify({'message': 'CORS preflight response'})
    return _corsify_actual_response(response)

def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response

if __name__ == '__main__':
    logger.info("Starting Flask server")
    app.run(debug=True, host='0.0.0.0', port=5000)
