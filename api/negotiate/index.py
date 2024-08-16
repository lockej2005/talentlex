from fastapi import FastAPI, HTTPException
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
    allow_origins=["*"],
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

@app.post("/api/user-agent")
async def user_agent_endpoint(request: AgentRequest):
    try:
        response = await user_agent.generate_response(request.scenario, request.previous_responses)
        return response
    except Exception as e:
        logger.error(f"Error in user-agent endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/opposition-agent")
async def opposition_agent_endpoint(request: AgentRequest):
    try:
        response = await opposing_agent.generate_response(request.scenario, request.previous_responses)
        return response
    except Exception as e:
        logger.error(f"Error in opposition-agent endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/user-decision")
async def user_decision_endpoint(request: DecisionRequest):
    try:
        response = await user_decision_agent.make_decision(request.scenario, request.conversation_history)
        return response
    except Exception as e:
        logger.error(f"Error in user-decision endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/lawyer-decision")
async def lawyer_decision_endpoint(request: DecisionRequest):
    try:
        response = await lawyer_decision_agent.make_decision(request.scenario, request.conversation_history, request.user_offer)
        return response
    except Exception as e:
        logger.error(f"Error in lawyer-decision endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# For serverless deployment, you typically don't need the following:
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)