import os
from openai import OpenAI
from typing import List, Dict
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def calculate_points_used(total_tokens):
    if total_tokens <= 50:
        return 1
    elif total_tokens <= 100:
        return 2
    elif total_tokens <= 150:
        return 3
    elif total_tokens <= 200:
        return 4
    elif total_tokens <= 250:
        return 5
    elif total_tokens <= 300:
        return 6
    elif total_tokens <= 350:
        return 7
    elif total_tokens <= 400:
        return 8
    elif total_tokens <= 450:
        return 9
    else:
        return 10

class UserLawyerAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    async def generate_response(self, scenario: str, previous_responses: List[dict]) -> Dict[str, str]:
        logger.info(f"UserLawyerAgent generating response for scenario: {scenario[:50]}...")
        logger.info(f"Previous responses: {previous_responses}")
        
        messages = [
            {"role": "system", "content": "You are a Lawyer representing the user's request given in the scenario. You are speaking straight to the opposition in this negotiation, keep your responses short, concise, factual and straight to the point. Respond with a JSON object containing a 'heading' that summarises the crux of this argument iteration (max 10 words) and 'content' (max 100 words)."},
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
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            logger.info(f"UserLawyerAgent response: {result}")
            
            # Calculate and log token usage and points used
            total_tokens = response.usage.total_tokens
            points_used = calculate_points_used(total_tokens)
            logger.info(f"Token usage - Prompt: {response.usage.prompt_tokens}, Completion: {response.usage.completion_tokens}, Total: {total_tokens}")
            logger.info(f"Points used: {points_used}")
            
            return result

        except Exception as e:
            logger.error(f"Error in UserLawyerAgent: {str(e)}")
            return {"heading": "Error", "content": "An error occurred while generating the response."}

class UserDecisionAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    async def make_decision(self, scenario: str, conversation_history: List[dict]) -> Dict[str, str]:
        logger.info(f"UserDecisionAgent making decision for scenario: {scenario[:50]}...")
        logger.info(f"Conversation history: {conversation_history}")
        
        messages = [
            {"role": "system", "content": "You are a decision-making agent for the user. Based on the negotiation history, you need to make a final offer. Respond with a JSON object containing 'offer_details', 'price', 'terms', and 'extra' fields."},
            {"role": "user", "content": f"Scenario: {scenario}\n\nConversation History:\n" + "\n".join([f"{'User' if r['side'] == 'user' else 'Opposition'}: {r['content']}" for r in conversation_history])}
        ]

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=300,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            logger.info(f"UserDecisionAgent decision: {result}")
            
            # Calculate and log token usage and points used
            total_tokens = response.usage.total_tokens
            points_used = calculate_points_used(total_tokens)
            logger.info(f"Token usage - Prompt: {response.usage.prompt_tokens}, Completion: {response.usage.completion_tokens}, Total: {total_tokens}")
            logger.info(f"Points used: {points_used}")
            
            return result

        except Exception as e:
            logger.error(f"Error in UserDecisionAgent: {str(e)}")
            return {"offer_details": "Error", "price": "N/A", "terms": "N/A", "extra": "An error occurred while generating the decision."}