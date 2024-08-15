import os
from openai import OpenAI
from typing import List

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class UserLawyerAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    async def generate_response(self, scenario: str, previous_responses: List[dict]) -> str:
        messages = [
            {"role": "system", "content": "You are an Lawyer representing the user's request given in the scenario. You are speaking straight to the opposition in this negotiation, keep your responses short, concise (100 words), factual and striaght to the point."},
            {"role": "user", "content": f"Scenario: {scenario}"}
        ]

        for response in previous_responses:
            role = "assistant" if response["side"] == "user" else "user"
            messages.append({"role": role, "content": response["content"]})

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=300,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in UserLawyerAgent: {str(e)}")
            return "An error occurred while generating the response."