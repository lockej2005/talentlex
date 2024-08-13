from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r') as file:
        return file.read()
    
system_prompt = read_prompt('goodwin_draft.txt')
@app.route('/generate-draft', methods=['POST'])
def generate_draft():
    data = request.json
    firm = data.get('firm')
    question = data.get('question')
    key_reasons = data.get('keyReasons')
    relevant_experience = data.get('relevantExperience')
    relevant_interaction = data.get('relevantInteraction')
    personal_info = data.get('personalInfo')

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
        return jsonify({"draft": generated_draft})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)