import os
import json
import logging
import traceback
from flask import Flask, request, jsonify
from openai import OpenAI
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GOOGLE_CSE_ID = "b7adcaafedbb6484a"

client = OpenAI(api_key=OPENAI_API_KEY)

# Basic error handling
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled exception: {str(e)}")
    logger.error(traceback.format_exc())
    return jsonify(error=str(e)), 500

@app.before_request
def log_request_info():
    logger.debug('Headers: %s', request.headers)
    logger.debug('Body: %s', request.get_data())

def get_openai_response(messages, model="gpt-3.5-turbo"):
    try:
        logger.info(f"Sending request to OpenAI API with model: {model}")
        response = client.chat.completions.create(
            model=model,
            messages=messages
        )
        logger.info("Received response from OpenAI API")
        return response
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def generate_search_queries(user_prompt):
    system_prompt = """You are an AI assistant specialized in generating relevant search queries. Based on the given user input, generate 1-3 search queries that would be useful for finding information to answer the user's question or address their concern. Format your response as a JSON object with the following structure:

    {
      "search_queries": [
        "Query 1",
        "Query 2",
        "Query 3"
      ]
    }

    Ensure that your response is a valid JSON object."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        logger.info("Generating search queries")
        openai_response = get_openai_response(messages)
        content = openai_response.choices[0].message.content
        logger.info(f"Raw OpenAI response for search queries: {content}")
        queries = json.loads(content)
        logger.info(f"Generated search queries: {queries['search_queries']}")
        return queries['search_queries']
    except Exception as e:
        logger.error(f"Error generating search queries: {str(e)}")
        logger.error(traceback.format_exc())
        return []

def google_search(query):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': GOOGLE_API_KEY,
        'cx': GOOGLE_CSE_ID,
        'q': query
    }
    logger.info(f"Sending Google search request for query: {query}")
    response = requests.get(url, params=params)
    logger.info(f"Received Google search response for query: {query}")
    return response.json()

def get_page_content(url):
    try:
        logger.info(f"Fetching content from URL: {url}")
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text
        text = soup.get_text(separator=' ', strip=True)
        
        # Break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        logger.info(f"Successfully extracted content from URL: {url}")
        return text[:2000]  # Limit to first 2000 characters
    except Exception as e:
        logger.error(f"Error scraping {url}: {str(e)}")
        logger.error(traceback.format_exc())
        return ""

@app.route('/process_prompt', methods=['POST'])
def process_prompt():
    logger.info("Received request to /process_prompt")
    try:
        user_prompt = request.json.get('prompt')
        logger.info(f"Received prompt: {user_prompt}")

        # Get search queries
        search_queries = generate_search_queries(user_prompt)

        # Perform Google searches and fetch content
        scraped_contents = []
        for query in search_queries:
            search_result = google_search(query)
            logger.info(f"Google API response for query '{query}': {json.dumps(search_result, indent=2)}")
            
            # Fetch content for up to 6 results across all queries
            for item in search_result.get('items', []):
                if len(scraped_contents) >= 6:
                    break
                url = item['link']
                content = get_page_content(url)
                scraped_contents.append({"url": url, "content": content})
            
            if len(scraped_contents) >= 6:
                break

        # Prepare the context for OpenAI
        context = "\n\n".join([f"Content from {item['url']}:\n{item['content']}" for item in scraped_contents])

        # Generate due diligence points with additional context
        system_prompt = """You are an AI assistant specialized in due diligence for mergers and acquisitions. Here's the context for your analysis:

        Known risks are those uncovered by the Buyer during due diligence or voluntarily disclosed by the Seller. These are typically managed through express indemnities. For example, if Seller is subject to a pending lawsuit from a former partner, Buyer may require Seller's owners to indemnify Buyer against any costs associated with that lawsuit. Such indemnities are often tailored to the specific risks and can last indefinitely.

        Unknown risks are those neither party is aware of at the time of closing and are not uncovered during due diligence. These are typically managed through the Seller's warranties and representations. In the SPA, the Seller will make various representations and warranties about the business, financial condition, intellectual property, and other matters. If the Seller qualifies these warranties through a disclosure letter, the risk may shift back to the Buyer. For example, if a lawsuit is pending but disclosed in the disclosure letter, Buyer may not have recourse for that issue under the warranty regime.

        If, after closing, Buyer discovers that a representation made by Seller's owners is untrue, Buyer could seek recourse for breach of warranty. Such claims are typically subject to an indemnity regime that specifies the extent and duration of the Seller's liability.

        Representations and warranties are usually categorised as general, fundamental, or special. General representations typically cover the business and financial affairs and survive for 12-24 months. Fundamental representations deal with core issues like ownership of shares, authority, and title, often surviving for the maximum period allowed by law. Special representations might cover sensitive areas such as intellectual property, privacy, and cyber security, with survival periods ranging from 2-5 years.

        Liability for breaches of representations and warranties is often capped. General representations might be capped at 10-20% of the purchase price, while fundamental representations might be capped at the full purchase price. Special representations often involve higher caps but less than the full purchase price.

        Buyer claims for indemnification or breach of warranty may also be subject to a deductible (referred to as a "basket"), typically ranging from 0.5-2% of the purchase price. There are "non-tipping" baskets, where the Buyer can only claim amounts exceeding the basket threshold, and "tipping" baskets, where the Buyer can recover from the first pound once the threshold is met. Fraudulent claims are typically uncapped and unlimited in duration.

        Buyers usually want a secure source of funds for indemnity claims, often holding back or escrowing a portion of the purchase price until the expiration of the relevant survival period. Any remaining funds after this period would be released to the Seller.

        Remember, this is an adversarial negotiation. Everyone aims to maximise their benefits and minimise their risks. Buyer wants to limit Seller's exposure to liabilities, while Seller's owners want to maximise the purchase price and limit their exposure.

        Based on the given scenario, user input, and additional context, identify 6 key points a Lawyer could use for due diligence in the given context. For each point, provide a title, a detailed explanation, and cite the specific source (URL) to cite where you got the information from, for liability reasons.

        Before you reply, consider your Belief, Desire, and Intention in the following format:
        - Belief: Your understanding of the situation, including any assumptions or knowledge.
        - Desire: Your goals, preferences, and motivations.
        - Intention: Your committed plan of action based on your beliefs and desires.

        Then, provide your response in the following format:

        {
          "due_diligence_points": [
            {
              "title": "Point 1 Title",
              "explanation": "Detailed explanation of point 1",
              "source": "URL of the source for this point"
            },
            {
              "title": "Point 2 Title",
              "explanation": "Detailed explanation of point 2",
              "source": "URL of the source for this point"
            },
            ...
          ],
          "helpful_links": [
            "URL 1",
            "URL 2",
            ...
          ]
        }

        Ensure that your response is a valid JSON object. Make sure to include specific facts and information from the provided context in your explanations."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"User Prompt: {user_prompt}\n\nAdditional Context:\n{context}"}
        ]

        openai_response = get_openai_response(messages)
        due_diligence_content = openai_response.choices[0].message.content
        logger.info(f"Raw OpenAI response for due diligence: {due_diligence_content}")
        due_diligence_points = json.loads(due_diligence_content)

        # Prepare the result
        result = {
            "search_queries": search_queries,
            "due_diligence_points": due_diligence_points["due_diligence_points"],
            "helpful_links": due_diligence_points.get("helpful_links", []),
            "scraped_contents": [{"url": item['url'], "content": item['content']} for item in scraped_contents]
        }

        logger.info("Successfully processed prompt and generated response")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in process_prompt: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(debug=True)