from flask import Flask, request, jsonify
import logging
import os
import json
from openai import OpenAI
from typing import List, Dict

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Flask app initialization
app = Flask(__name__)

# Define the agents
class UserLawyerAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    def generate_response(self, scenario: str, previous_responses: List[dict]) -> Dict[str, str]:
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
            return result

        except Exception as e:
            logger.error(f"Error in UserLawyerAgent: {str(e)}")
            return {"heading": "Error", "content": "An error occurred while generating the response."}

class OpposingLawyerAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    def generate_response(self, scenario: str, previous_responses: List[dict]) -> Dict[str, str]:
        logger.info(f"OpposingLawyerAgent generating response for scenario: {scenario[:50]}...")
        logger.info(f"Previous responses: {previous_responses}")
        
        messages = [
            {"role": "system", "content": "You are a Lawyer opposing the user's request given in the scenario. You are speaking straight to the user's lawyer in this negotiation, keep your responses short, concise, factual and straight to the point. Respond with a JSON object containing a 'heading' that summarises the crux of this argument iteration (max 10 words) and 'content' (max 100 words)."},
            {"role": "user", "content": f"Scenario: {scenario}"}
        ]

        for response in previous_responses:
            role = "assistant" if response["side"] == "opposing" else "user"
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
            logger.info(f"OpposingLawyerAgent response: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in OpposingLawyerAgent: {str(e)}")
            return {"heading": "Error", "content": "An error occurred while generating the response."}

class UserDecisionAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    def make_decision(self, scenario: str, conversation_history: List[dict]) -> Dict[str, str]:
        logger.info(f"UserDecisionAgent making decision for scenario: {scenario[:50]}...")
        logger.info(f"Conversation history: {conversation_history}")
        
        messages = [
            {"role": "system", "content": "You are a decision-making agent for the user. Based on the negotiation history, you need to make a final offer. Respond with a JSON object containing 'offer_details', 'price', 'terms', and 'extra' fields. Have a personality of candid business lawyer who is very outcome focused and factual, don't worry about introductory phrases. e.g. Our party proposes a price of x under these conditions."},
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
            return result

        except Exception as e:
            logger.error(f"Error in UserDecisionAgent: {str(e)}")
            return {"offer_details": "Error", "price": "N/A", "terms": "N/A", "extra": "An error occurred while generating the decision."}

class LawyerDecisionAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    def make_decision(self, scenario: str, conversation_history: List[dict], user_offer: Dict[str, str]) -> Dict[str, str]:
        logger.info(f"LawyerDecisionAgent making decision for scenario: {scenario[:50]}...")
        logger.info(f"Conversation history: {conversation_history}")
        logger.info(f"User offer: {user_offer}")
        
        messages = [
            {"role": "system", "content": "You are a decision-making agent for the opposing lawyer. Based on the negotiation history and the user's final offer, you need to decide whether to accept or reject the offer. Respond with a JSON object containing 'decision' (either 'accepted' or 'rejected') and 'justification' fields."},
            {"role": "user", "content": f"Scenario: {scenario}\n\nConversation History:\n" + "\n".join([f"{'User' if r['side'] == 'user' else 'Opposition'}: {r['content']}" for r in conversation_history]) + f"\n\nUser's Final Offer:\n{json.dumps(user_offer, indent=2)}"}
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
            logger.info(f"LawyerDecisionAgent decision: {result}")
            return result

        except Exception as e:
            logger.error(f"Error in LawyerDecisionAgent: {str(e)}")
            return {"decision": "error", "justification": "An error occurred while generating the decision."}

# Instantiate the agents
user_agent = UserLawyerAgent()
opposing_agent = OpposingLawyerAgent()
user_decision_agent = UserDecisionAgent()
lawyer_decision_agent = LawyerDecisionAgent()

# Flask routes
@app.route("/user-agent", methods=["POST"])
def user_agent_endpoint():
    try:
        data = request.json
        logger.info(f"Received request for user-agent: {data}")
        response = user_agent.generate_response(data['scenario'], data['previous_responses'])
        logger.info(f"Generated response: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in user-agent endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route("/opposition-agent", methods=["POST"])
def opposition_agent_endpoint():
    try:
        data = request.json
        logger.info(f"Received request for opposition-agent: {data}")
        response = opposing_agent.generate_response(data['scenario'], data['previous_responses'])
        logger.info(f"Generated response: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in opposition-agent endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route("/user-decision", methods=["POST"])
def user_decision_endpoint():
    try:
        data = request.json
        logger.info(f"Received request for user-decision: {data}")
        response = user_decision_agent.make_decision(data['scenario'], data['conversation_history'])
        logger.info(f"Generated response: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in user-decision endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route("/lawyer-decision", methods=["POST"])
def lawyer_decision_endpoint():
    try:
        data = request.json
        logger.info(f"Received request for lawyer-decision: {data}")
        response = lawyer_decision_agent.make_decision(data['scenario'], data['conversation_history'], data.get('user_offer'))
        logger.info(f"Generated response: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in lawyer-decision endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route("/<path:path_name>", methods=["GET", "POST", "PUT", "DELETE"])
def catch_all(path_name):
    return jsonify({"message": f"You've reached the catch-all route. The path is: /{path_name}"})


if __name__ == "__main__":
    app.run(debug=True)
