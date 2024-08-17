from flask import Flask, request, jsonify
import logging
from user_lawyer_agent import UserLawyerAgent, UserDecisionAgent
from opposing_lawyer_agent import OpposingLawyerAgent, LawyerDecisionAgent

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Instantiate the agents
user_agent = UserLawyerAgent()
opposing_agent = OpposingLawyerAgent()
user_decision_agent = UserDecisionAgent()
lawyer_decision_agent = LawyerDecisionAgent()

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
