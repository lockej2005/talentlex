# File: api/negotiate/index.py

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Union
from user_lawyer_agent import UserLawyerAgent, UserDecisionAgent
from opposing_lawyer_agent import OpposingLawyerAgent, LawyerDecisionAgent
import logging

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

class AgentRequest(BaseModel):
    scenario: str
    previous_responses: List[dict]

class DecisionRequest(BaseModel):
    scenario: str
    conversation_history: List[dict]
    user_offer: Dict[str, Union[str, int, Dict[str, str]]] = None

user_agent = UserLawyerAgent()
opposing_agent = OpposingLawyerAgent()
user_decision_agent = UserDecisionAgent()
lawyer_decision_agent = LawyerDecisionAgent()

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

@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(request: Request, path_name: str):
    return {"message": f"You've reached the catch-all route. The path is: /{path_name}"}