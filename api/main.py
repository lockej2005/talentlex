from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)  # This allows CORS for all domains on all routes

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.route('/api/submit_application', methods=['POST'])
def submit_application():
    data = request.json
    application_text = data.get('applicationText')
    
    if not application_text:
        return jsonify({"error": "No application text provided"}), 400

    try:
        # Call OpenAI API
        completion = client.chat.completions.create(
            model="ft:gpt-4o-mini-2024-07-18:personal:4omini-v1:9u6vf9Ey",
            messages=[
                {"role": "system", "content": "You are an AI assistant that provides feedback on job applications."},
                {"role": "user", "content": f"New application to be analyzed:\n\n{application_text}"}
            ]
        )

        # Extract the AI's response
        ai_feedback = completion.choices[0].message.content

        return jsonify({
            "success": True,
            "feedback": ai_feedback
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# No need for app.run(), Vercel handles the server
