from http.server import BaseHTTPRequestHandler
import os
import json
import logging
import traceback
from openai import OpenAI
import http.client
import urllib.parse
from urllib.request import urlopen
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
GOOGLE_API_KEY = "AIzaSyBqJNAkR48aA-9VKTpawAsUIjqQqou6q9I"
GOOGLE_CSE_ID = "b7adcaafedbb6484a"

if not OPENAI_API_KEY:
    logger.error("OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.")
    raise ValueError("OpenAI API key is not set")

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

def generate_search_queries(user_prompt):
    system_prompt = """You are an AI assistant specialized in generating relevant search queries. Based on the given user input, generate 6 separate search queries relevant to due diligence research a lawyer might need to do in relation to the given context. Format your response as a JSON object with the following structure:

    {
      "search_queries": [
        "Query 1",
        "Query 2",
        "Query 3",
        "Query 4",
        "Query 5",
        "Query 6"
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
        
        # Try to parse the content as JSON
        try:
            queries = json.loads(content)
        except json.JSONDecodeError as json_err:
            logger.error(f"Failed to parse OpenAI response as JSON: {str(json_err)}")
            logger.error(f"Raw content: {content}")
            
            # Attempt to extract queries using a simple string parsing method
            lines = content.split('\n')
            queries = {"search_queries": [line.strip() for line in lines if line.strip() and not line.strip().startswith('{') and not line.strip().endswith('}')}]
        
        logger.info(f"Generated search queries: {queries['search_queries']}")
        return queries['search_queries'], content  # Return both queries and raw content
    except Exception as e:
        logger.error(f"Error generating search queries: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return [], str(e)  # Return empty list and error message

def google_search(query):
    conn = http.client.HTTPSConnection("www.googleapis.com")
    params = urllib.parse.urlencode({
        'key': GOOGLE_API_KEY,
        'cx': GOOGLE_CSE_ID,
        'q': query,
        'num': 1  # Limit to 1 result
    })
    logger.info(f"Sending Google search request for query: {query}")
    conn.request("GET", f"/customsearch/v1?{params}")
    response = conn.getresponse()
    data = response.read()
    conn.close()
    logger.info(f"Received Google search response for query: {query}")
    return json.loads(data)

def get_page_content(url):
    try:
        logger.info(f"Fetching content from URL: {url}")
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        req = urllib.request.Request(url, headers=headers)
        with urlopen(req, timeout=10) as response:
            html = response.read()
        
        soup = BeautifulSoup(html, 'html.parser')
        
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

def process_prompt(user_prompt):
    logger.info(f"Processing prompt: {user_prompt}")
    result = {
        "user_prompt": user_prompt,
        "steps": []
    }
    try:
        # Step 1: Generate search queries
        search_queries, raw_query_response = generate_search_queries(user_prompt)
        result["steps"].append({
            "step": "Generate Search Queries",
            "search_queries": search_queries,
            "raw_openai_response": raw_query_response
        })
        
        if not search_queries:
            logger.warning("No search queries were generated. Returning error response.")
            result["error"] = "Failed to generate search queries"
            return result

        # Step 2: Perform Google searches and fetch content
        scraped_contents = []
        google_search_results = []
        for query in search_queries:
            search_result = google_search(query)
            google_search_results.append({"query": query, "result": search_result})
            logger.info(f"Google API response for query '{query}': {json.dumps(search_result, indent=2)}")
            
            # Fetch content for the single top result of each query
            if search_result.get('items'):
                item = search_result['items'][0]
                url = item['link']
                content = get_page_content(url)
                scraped_contents.append({"url": url, "content": content})

        result["steps"].append({
            "step": "Google Search and Content Scraping",
            "google_search_results": google_search_results,
            "scraped_contents": scraped_contents
        })

        # Step 3: Prepare the context for OpenAI
        context = "\n\n".join([f"Content from {item['url']}:\n{item['content']}" for item in scraped_contents])
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

        Based on the given scenario, user input, and additional context, identify 6 key points a Lawyer could use for due diligence in the given context. For each point, provide a title, a detailed explanation, and cite a specific source (URL) from the user prompt to cite where you got the information from, this url needs to be from additional context retrieved by a Google API call and provided to you in the user prompt.

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

        logger.info("Successfully processed prompt and generated response")
        return result
    except Exception as e:
        logger.error(f"Error in process_prompt: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        result["error"] = "An unexpected error occurred"
        result["error_details"] = str(e)
        result["error_traceback"] = traceback.format_exc()
        return result

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        user_prompt = data.get('prompt')
        
        if not user_prompt:
            self.send_error(400, "Missing 'prompt' in request body")
            return

        try:
            result = process_prompt(user_prompt)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps(result)
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()