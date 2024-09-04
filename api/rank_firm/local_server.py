from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Load the system prompt from firm_context.txt
try:
    with open("firm_context.txt", "r", encoding="utf-8") as file:
        system_prompt = file.read().strip()
except UnicodeDecodeError:
    # If UTF-8 fails, try reading with 'latin-1' encoding
    with open("firm_context.txt", "r", encoding="latin-1") as file:
        system_prompt = file.read().strip()
except FileNotFoundError:
    print("Error: firm_context.txt file not found.")
    system_prompt = "Default system prompt: You are a helpful assistant."

@app.route("/rank-firms", methods=["POST"])
def rank_firms():
    # Get the profile from the request
    profile = request.json.get("profile")
    
    if not profile:
        return jsonify({"error": "Profile not provided"}), 400

    try:
        # Create a ChatCompletion request
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # You can change this to the appropriate model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": profile}
            ]
        )

        # Extract the assistant's reply
        assistant_reply = response.choices[0].message.content

        return jsonify({"response": assistant_reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)