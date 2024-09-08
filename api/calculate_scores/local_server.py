import os
import json
from openai import OpenAI
from flask import Flask, request, jsonify
from flask_cors import CORS
from pydantic import BaseModel

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000", "methods": ["GET", "POST", "OPTIONS"]}})

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ScoreRequest(BaseModel):
    workexp_content: str
    workexp_model: str
    workexp_prompt: str
    opentext_content: str
    opentext_model: str
    opentext_prompt: str
    education_content: str
    education_model: str
    education_prompt: str

def calculate_workexp_score(content, model, prompt):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": f"You are an AI expert in evaluating work experience for job applications. Your task is to rate the given work experience and provide a justification for your rating. {prompt} Provide your response in JSON format with the following structure: {{\"score\": (a number between 0 and 100), \"justification\": \"Your explanation here\"}}"},
                {"role": "user", "content": content}
            ],
            temperature=0.3,
            max_tokens=250,
            n=1,
            stop=None,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Error calculating work experience score: {str(e)}")
        return {"error": f"Error calculating work experience score: {str(e)}"}, 500

def calculate_education_score(content, model, prompt):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": f"You are an AI expert in evaluating educational qualifications for job applications. Your task is to rate the given education details and provide a justification for your rating. {prompt} Provide your response in JSON format with the following structure: {{\"score\": (a number between 0 and 100), \"justification\": \"Your explanation here\"}}"},
                {"role": "user", "content": content}
            ],
            temperature=0.5,
            max_tokens=250,
            n=1,
            stop=None,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Error calculating education score: {str(e)}")
        return {"error": f"Error calculating education score: {str(e)}"}, 500

def calculate_opentext_score(content, model, prompt):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": f"You are an AI expert in analyzing open-ended responses in job applications. Your task is to rate the given response and provide a justification for your rating. Consider factors such as clarity, relevance, and depth of insight. {prompt} Provide your response in JSON format with the following structure: {{\"score\": (a number between 0 and 100), \"justification\": \"Your explanation here\"}}"},
                {"role": "user", "content": content}
            ],
            temperature=0.4,
            max_tokens=250,
            n=1,
            stop=None,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Error calculating open text score: {str(e)}")
        return {"error": f"Error calculating open text score: {str(e)}"}, 500

@app.route("/calculate_score", methods=["POST", "OPTIONS"])
def calculate_scores():
    if request.method == "OPTIONS":
        return "", 200
    
    data = request.json
    workexp_result = calculate_workexp_score(data['workexp_content'], data['workexp_model'], data['workexp_prompt'])
    education_result = calculate_education_score(data['education_content'], data['education_model'], data['education_prompt'])
    opentext_result = calculate_opentext_score(data['opentext_content'], data['opentext_model'], data['opentext_prompt'])

    if isinstance(workexp_result, tuple) or isinstance(education_result, tuple) or isinstance(opentext_result, tuple):
        return jsonify({"error": "An error occurred during score calculation"}), 500

    workexp_score = workexp_result['score']
    education_score = education_result['score']
    opentext_score = opentext_result['score']

    weighted_score = (workexp_score * 0.4) + (education_score * 0.3) + (opentext_score * 0.3)

    return jsonify({
        "workexp": workexp_result,
        "education": education_result,
        "opentext": opentext_result,
        "weighted_score": weighted_score
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)