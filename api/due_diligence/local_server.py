import os
import json
import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import requests

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes and all origins

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
JIGSAW_API_KEY = os.environ.get("JIGSAW_API_KEY")

if not OPENAI_API_KEY:
    logger.error("OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.")
    raise ValueError("OpenAI API key is not set")

if not JIGSAW_API_KEY:
    logger.error("Jigsaw API key is not set. Please set the JIGSAW_API_KEY environment variable.")
    raise ValueError("Jigsaw API key is not set")

client = OpenAI(api_key=OPENAI_API_KEY)

def get_openai_response(messages, model="gpt-4o-mini"):
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

def generate_search_query(user_prompt):
    system_prompt = """You are an AI assistant specialized in generating relevant search queries. Based on the given user input, generate 1 search query relevant to due diligence research a lawyer might need to do in relation to the given context, keep the query short and succinct (less than 10 words) to get the most relevant results. Format your response as a JSON object with the following structure:

    {
        "query": "Your generated search query"
    }

    Ensure that your response is a valid JSON object."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        logger.info("Generating search query")
        openai_response = get_openai_response(messages)
        content = openai_response.choices[0].message.content
        logger.info(f"Raw OpenAI response for search query: {content}")
        
        query_json = json.loads(content)
        search_query = query_json["query"]
        
        logger.info(f"Generated search query: {search_query}")
        return search_query, content, openai_response.usage.total_tokens
    except Exception as e:
        logger.error(f"Error generating search query: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return "", str(e), 0

def jigsaw_search(query):
    url = "https://api.jigsawstack.com/v1/web/search"
    headers = {
        "x-api-key": JIGSAW_API_KEY
    }
    params = {
        "query": query,
        "ai_overview": "true",
        "safe_search": "moderate",
        "spell_check": "true"
    }
    
    logger.info(f"Sending Jigsaw search request for query: {query}")
    response = requests.get(url, headers=headers, params=params)
    logger.info(f"Received Jigsaw search response for query: {query}")
    
    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"Error in Jigsaw search: {response.status_code} - {response.text}")
        raise Exception(f"Jigsaw search failed: {response.status_code}")

def process_prompt(user_prompt):
    logger.info(f"Processing prompt: {user_prompt}")
    result = {
        "user_prompt": user_prompt,
        "steps": []
    }
    total_tokens = 0
    try:
        # Step 1: Generate search query
        search_query, raw_query_response, query_tokens = generate_search_query(user_prompt)
        total_tokens += query_tokens
        result["steps"].append({
            "step": "Generate Search Query",
            "search_query": search_query,
            "raw_openai_response": raw_query_response
        })
        
        if not search_query:
            logger.warning("No search query was generated. Returning error response.")
            result["error"] = "Failed to generate search query"
            return result

        # Step 2: Perform Jigsaw search
        search_result = jigsaw_search(search_query)
        result["steps"].append({
            "step": "Jigsaw Search",
            "search_result": search_result
        })

        # Step 3: Prepare the context for OpenAI using Jigsaw search results
        context_items = []
        for item in search_result.get('results', []):
            url = item.get('url', '')
            title = item.get('title', '')
            description = item.get('description', '')
            content = item.get('content', '')
            snippets = item.get('snippets', [])
            
            scraped_content = f"Title: {title}\nDescription: {description}\nContent: {content}\nSnippets: {' '.join(snippets)}"
            context_item = f"link: {url}\nscraped_content: {scraped_content}"
            context_items.append(context_item)

        context = "\n\n".join(context_items)
        result["steps"].append({
            "step": "Prepare Context",
            "context": context
        })

        # Step 4: Generate due diligence points with additional context
        system_prompt = """You are an AI assistant specialized in due diligence for mergers and acquisitions. Here's the context for your analysis:

        Known risks are those uncovered by the Buyer during due diligence or voluntarily disclosed by the Seller. These are typically managed through express indemnities. For example, if Seller is subject to a pending lawsuit from a former partner, Buyer may require Seller's owners to indemnify Buyer against any costs associated with that lawsuit. Such indemnities are often tailored to the specific risks and can last indefinitely.

        Unknown risks are those neither party is aware of at the time of closing and are not uncovered during due diligence. These are typically managed through the Seller's warranties and representations. In the SPA, the Seller will make various representations and warranties about the business, financial condition, intellectual property, and other matters. If the Seller qualifies these warranties through a disclosure letter, the risk may shift back to the Buyer. For example, if a lawsuit is pending but disclosed in the disclosure letter, Buyer may not have recourse for that issue under the warranty regime.

        If, after closing, Buyer discovers that a representation made by Seller's owners is untrue, Buyer could seek recourse for breach of warranty. Such claims are typically subject to an indemnity regime that specifies the extent and duration of the Seller's liability.

        Representations and warranties are usually categorised as general, fundamental, or special. General representations typically cover the business and financial affairs and survive for 12-24 months. Fundamental representations deal with core issues like ownership of shares, authority, and title, often surviving for the maximum period allowed by law. Special representations might cover sensitive areas such as intellectual property, privacy, and cyber security, with survival periods ranging from 2-5 years.

        Liability for breaches of representations and warranties is often capped. General representations might be capped at 10-20% of the purchase price, while fundamental representations might be capped at the full purchase price. Special representations often involve higher caps but less than the full purchase price.

        Buyer claims for indemnification or breach of warranty may also be subject to a deductible (referred to as a "basket"), typically ranging from 0.5-2% of the purchase price. There are "non-tipping" baskets, where the Buyer can only claim amounts exceeding the basket threshold, and "tipping" baskets, where the Buyer can recover from the first pound once the threshold is met. Fraudulent claims are typically uncapped and unlimited in duration.

        Buyers usually want a secure source of funds for indemnity claims, often holding back or escrowing a portion of the purchase price until the expiration of the relevant survival period. Any remaining funds after this period would be released to the Seller.

        Remember, this is an adversarial negotiation. Everyone aims to maximise their benefits and minimise their risks. Buyer wants to limit Seller's exposure to liabilities, while Seller's owners want to maximise the purchase price and limit their exposure.

        Based on the given scenario, user input, and additional context, identify 6 key points a Lawyer could use for due diligence in the given context. For each point, provide a title, a detailed explanation, and cite a specific source (URL) from the user prompt to cite where you got the information from, this url needs to be from additional context retrieved by a Jigsaw AI search call and provided to you in the user prompt. Use only links and the scraped content given from each link.

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

        result["steps"].append({
            "step": "Generate Due Diligence Points",
            "messages": messages
        })

        openai_response = get_openai_response(messages)
        due_diligence_content = openai_response.choices[0].message.content
        total_tokens += openai_response.usage.total_tokens
        logger.info(f"Raw OpenAI response for due diligence: {due_diligence_content}")
        due_diligence_points = json.loads(due_diligence_content)

        result["steps"].append({
            "step": "Process Due Diligence Points",
            "raw_openai_response": due_diligence_content,
            "processed_points": due_diligence_points
        })

        # Final result
        result["due_diligence_points"] = due_diligence_points["due_diligence_points"]
        result["helpful_links"] = due_diligence_points.get("helpful_links", [])
        result["usage"] = {
            "total_tokens": total_tokens
        }
        result["search_queries"] = [search_query]
        result["jigsaw_results"] = search_result.get('results', [])

        logger.info("Successfully processed prompt and generated response")
        return result
    except Exception as e:
        logger.error(f"Error in process_prompt: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        result["error"] = "An unexpected error occurred"
        result["error_details"] = str(e)
        result["error_traceback"] = traceback.format_exc()
        result["usage"] = {
            "total_tokens": total_tokens
        }
        return result

@app.route('/api/due_diligence', methods=['POST'])
def due_diligence():
    data = request.json
    prompt = data.get('prompt')
    
    if not prompt:
        return jsonify({"error": "Missing 'prompt' in request body"}), 400

    try:
        result = process_prompt(prompt)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error processing prompt: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)