from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from supabase import create_client, Client
import os

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Initialize Supabase client
supabase_url = "https://atbphpeswwgqvwlbplko.supabase.co"
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r') as file:
        return file.read()

system_prompt = read_prompt('default_prompt.txt')

@app.route('/generate-draft', methods=['POST'])
def generate_draft():
    data = request.json
    firm = data.get('firm')
    question = data.get('question')
    key_reasons = data.get('keyReasons')
    relevant_experience = data.get('relevantExperience')
    relevant_interaction = data.get('relevantInteraction')
    personal_info = data.get('personalInfo')
    uuid = data.get('uuid')

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
        # Generate draft using OpenAI
        completion = client.chat.completions.create(
            model="ft:gpt-4o-mini-2024-07-18:personal:appdrafterdataset:9vG3pVmA",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        
        generated_draft = completion.choices[0].message.content
        usage = completion.usage["total_tokens"]  # Get total token usage from response
        cost_in_credits = usage * 0.4  # Calculate cost in credits

        # Query Supabase to get the current credits of the user
        user_data = supabase.from_('profiles').select('credits').eq('id', uuid).single().execute()
        if user_data.error:
            return jsonify({"error": "Failed to retrieve user data."}), 500

        current_credits = user_data.data['credits']
        new_credits = current_credits - cost_in_credits

        if new_credits < 0:
            return jsonify({"error": "Insufficient credits."}), 400

        # Update the user's credits in Supabase
        update_response = supabase.from_('profiles').update({'credits': new_credits}).eq('id', uuid).execute()
        if update_response.error:
            return jsonify({"error": "Failed to update user credits."}), 500

        return jsonify({"draft": generated_draft, "remaining_credits": new_credits})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
