import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from user_lawyer_agent import UserLawyerAgent
from opposing_lawyer_agent import OpposingLawyerAgent

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

class AgentResponse(BaseModel):
    response: str

user_agent = UserLawyerAgent()
opposing_agent = OpposingLawyerAgent()

@app.post("/api/user-agent", response_model=AgentResponse)
async def user_agent_endpoint(request: AgentRequest):
    try:
        response = await user_agent.generate_response(request.scenario, request.previous_responses)
        return AgentResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/opposition-agent", response_model=AgentResponse)
async def opposition_agent_endpoint(request: AgentRequest):
    try:
        response = await opposing_agent.generate_response(request.scenario, request.previous_responses)
        return AgentResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)