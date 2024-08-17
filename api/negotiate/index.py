from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Union
import logging
import os
from openai import OpenAI
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to calculate points used
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

# OpenAI client setup
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Base classes
class AgentRequest(BaseModel):
    scenario: str
    previous_responses: List[dict]

class DecisionRequest(BaseModel):
    scenario: str
    conversation_history: List[dict]
    user_offer: Dict[str, Union[str, int, Dict[str, str]]] = None

# Agent classes
class OpposingLawyerAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    async def generate_response(self, scenario: str, previous_responses: List[dict]) -> Dict[str, str]:
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
            
            # Calculate and log token usage and points used
            total_tokens = response.usage.total_tokens
            points_used = calculate_points_used(total_tokens)
            logger.info(f"Token usage - Prompt: {response.usage.prompt_tokens}, Completion: {response.usage.completion_tokens}, Total: {total_tokens}")
            logger.info(f"Points used: {points_used}")
            
            return result

        except Exception as e:
            logger.error(f"Error in OpposingLawyerAgent: {str(e)}")
            return {"heading": "Error", "content": "An error occurred while generating the response."}

class LawyerDecisionAgent:
    def __init__(self):
        self.model = "gpt-4o-mini"

    async def make_decision(self, scenario: str, conversation_history: List[dict], user_offer: Dict[str, str]) -> Dict[str, str]:
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
            
            # Calculate and log token usage and points used
            total_tokens = response.usage.total_tokens
            points_used = calculate_points_used(total_tokens)
            logger.info(f"Token usage - Prompt: {response.usage.prompt_tokens}, Completion: {response.usage.completion_tokens}, Total: {total_tokens}")
            logger.info(f"Points used: {points_used}")
            
            return result

        except Exception as e:
            logger.error(f"Error in LawyerDecisionAgent: {str(e)}")
            return {"decision": "error", "justification": "An error occurred while generating the decision."}

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

# Instantiate the agents
user_agent = UserLawyerAgent()
opposing_agent = OpposingLawyerAgent()
user_decision_agent = UserDecisionAgent()
lawyer_decision_agent = LawyerDecisionAgent()

# API Endpoints
@app.post("/user-agent")
async def user_agent_endpoint(request: AgentRequest):
    try:
        logger.info(f"Received request for user-agent: {request}")
        response = await user_agent.generate_response(request.scenario, request.previous_responses)
        logger.info(f"Generated response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in user-agent endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/opposition-agent")
async def opposition_agent_endpoint(request: AgentRequest):
    try:
        logger.info(f"Received request for opposition-agent: {request}")
        response = await opposing_agent.generate_response(request.scenario, request.previous_responses)
        logger.info(f"Generated response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in opposition-agent endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/user-decision")
async def user_decision_endpoint(request: DecisionRequest):
    try:
        logger.info(f"Received request for user-decision: {request}")
        response = await user_decision_agent.make_decision(request.scenario, request.conversation_history)
        logger.info(f"Generated response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in user-decision endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/lawyer-decision")
async def lawyer_decision_endpoint(request: DecisionRequest):
    try:
        logger.info(f"Received request for lawyer-decision: {request}")
        response = await lawyer_decision_agent.make_decision(request.scenario, request.conversation_history, request.user_offer)
        logger.info(f"Generated response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in lawyer-decision endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Catch-all route
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(request: Request, path_name: str):
    return {"message": f"You've reached the catch-all route. The path is: /{path_name}"}
