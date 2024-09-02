from flask import Flask, request, jsonify
from flask_cors import CORS
from jigsawstack import JigsawStack
from jigsawstack.exceptions import JigsawStackError
import os
import logging
from logging.handlers import RotatingFileHandler
import time
import json
import traceback

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
handler = RotatingFileHandler('app.log', maxBytes=100000, backupCount=5)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.DEBUG)

# Initialize JigsawStack client
jigsawstack = JigsawStack(api_key="sk_0cbf9d0b8bb72b6fd6b37b7ccbcd6ed0ce3dd4071085339a22446da533c9b924a416f333d14c22ce374fc49e07bfbed5ccb59a5cf33929ae48f8b71074bf8acc0240FLHWDqEs4KLg1S4Ua")

def load_linkedin_cookies():
    try:
        with open('linkedin_cookies.json', 'r') as f:
            cookies = json.load(f)
        app.logger.debug(f"Loaded cookies: {json.dumps(cookies, indent=2)}")
        return cookies
    except FileNotFoundError:
        app.logger.error("LinkedIn cookies file not found")
        return []
    except json.JSONDecodeError:
        app.logger.error("Error decoding LinkedIn cookies JSON")
        return []

@app.route('/scrape-linkedin', methods=['POST'])
def scrape_linkedin():
    start_time = time.time()
    request_id = str(int(start_time * 1000))
    app.logger.info(f"Request {request_id} received for LinkedIn scraping")

    data = request.json
    app.logger.debug(f"Request {request_id}: Received data: {json.dumps(data, indent=2)}")

    linkedin_url = data.get('linkedin_url')
    
    if not linkedin_url:
        app.logger.warning(f"Request {request_id} failed: LinkedIn URL is missing")
        return jsonify({"error": "LinkedIn URL is required"}), 400

    app.logger.info(f"Request {request_id}: Scraping URL - {linkedin_url}")

    try:
        linkedin_cookies = load_linkedin_cookies()
        app.logger.info(f"Request {request_id}: Loaded {len(linkedin_cookies)} LinkedIn cookies")

        app.logger.info(f"Request {request_id}: Initiating JigsawStack AI scrape")
        scrape_config = {
            "url": linkedin_url,
            "element_prompts": [
                "Education (name of school)",
                "Qualification (e.g. Bachelor's, Master's)",
                "Work Experience (company name and role)"
            ],
            "advance_config": {
                "wait_for": {
                    "mode": "networkidle0"
                },
                "timeout": 30000,
                "cookies": linkedin_cookies
            }
        }
        app.logger.debug(f"Request {request_id}: Scrape config: {json.dumps(scrape_config, indent=2)}")

        result = jigsawstack.web.ai_scrape(scrape_config)

        app.logger.debug(f"Request {request_id}: Raw JigsawStack response: {json.dumps(result, indent=2)}")

        if result.get('success'):
            app.logger.info(f"Request {request_id}: Scraping successful")
            scraped_data = result.get('data', {})
            formatted_data = {
                "Education": scraped_data.get("Education (name of school)", "Not found"),
                "Qualification": scraped_data.get("Qualification (e.g. Bachelor's, Master's)", "Not found"),
                "Work Experience": scraped_data.get("Work Experience (company name and role)", "Not found")
            }
            app.logger.info(f"Request {request_id}: Formatted data - {json.dumps(formatted_data, indent=2)}")
            
            end_time = time.time()
            duration = end_time - start_time
            app.logger.info(f"Request {request_id} completed in {duration:.2f} seconds")
            
            return jsonify(formatted_data), 200
        else:
            app.logger.error(f"Request {request_id}: Scraping failed - {json.dumps(result, indent=2)}")
            return jsonify({"error": "Scraping failed", "details": result}), 500

    except JigsawStackError as jse:
        app.logger.error(f"Request {request_id}: JigsawStack error - {str(jse)}")
        app.logger.debug(f"Request {request_id}: JigsawStack error traceback:\n{traceback.format_exc()}")
        return jsonify({"error": "JigsawStack error", "details": str(jse)}), 400
    except Exception as e:
        app.logger.exception(f"Request {request_id}: An unexpected error occurred during scraping")
        app.logger.debug(f"Request {request_id}: Unexpected error traceback:\n{traceback.format_exc()}")
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    app.logger.info("Health check endpoint accessed")
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.logger.info("Starting the LinkedIn Scraper Server")
    app.run(debug=True)