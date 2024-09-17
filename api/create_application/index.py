import json
import os
from openai import OpenAI
from http.server import BaseHTTPRequestHandler

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r', encoding='utf-8') as file:
        return file.read()

# Read the prompts
sidley_austin_career_question = read_prompt('sidley_austin_career_question.txt')
goodwin_why_question = read_prompt('goodwin_why_question.txt')
jones_day_prompt = read_prompt('jones_day_prompt.txt')
default_prompt = read_prompt('default_prompt.txt')

# New Ashurst prompts
ashurst_why_law_and_ashurst = read_prompt('Ashurst_why_law_and_Ashurst_question.txt')
ashurst_key_skills = read_prompt('Ashurst_key_skills_question.txt')
ashurst_hobbies_and_interests = read_prompt('Ashurst_hobbies_and_interests_question.txt')
ashurst_recent_setback = read_prompt('Ashurst_example_of_a_recent_setback_question.txt')

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

        if not firmName or not question:
            self.send_error_response(400, f"Missing required data. firmName: {firmName}, question: {question}")
            return

        try:
            # Select the appropriate prompt based on firm and question
            if firmName == "Sidley Austin" and question == "Why does a career in commercial law and specifically Sidley Austin interest you? (250 words max)":
                system_prompt = sidley_austin_career_question
                base_model="gpt-4o-mini"   
            elif firmName == "Goodwin" and question == "Why are you applying to Goodwin? (100 words)":
                system_prompt = goodwin_why_question
                base_model = "ft:gpt-4o-mini-2024-07-18:personal:appdrafterdataset:9vG3pVmA"
            elif firmName == "Jones Day":
                system_prompt = jones_day_prompt
                base_model = "ft:gpt-4o-2024-08-06:personal:jonesdaydrafter:9zJFj48D"
            elif firmName == "Ashurst":
                if question == "What has motivated you to pursue a career in commercial law and more specifically, why have you applied to Ashurst? (300 words max)":
                    system_prompt = ashurst_why_law_and_ashurst
                elif question == "In 300 words, provide some examples of the key skills that you have gained through your work experience, extracurricular activities, or studies that you think would make you a good trainee at Ashurst. (300 words max)":
                    system_prompt = ashurst_key_skills
                elif question == "In 300 words, tell us about your hobbies and interests. (300 words max)":
                    system_prompt = ashurst_hobbies_and_interests
                elif question == "Can you provide an example of a recent set back you have had, and how you have overcome this. (300 words max)":
                    system_prompt = ashurst_recent_setback
                else:
                    system_prompt = default_prompt
                base_model = "gpt-4o-mini"
            else:
                system_prompt = default_prompt
                base_model="gpt-4o-mini"   

            model = data.get('model', base_model)

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