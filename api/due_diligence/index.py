# api/process_prompt.py

import os
import json
import logging
from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import requests
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GOOGLE_CSE_ID = "b7adcaafedbb6484a"

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
        
        for script in soup(["script", "style"]):
            script.decompose()
        
        text = soup.get_text(separator=' ', strip=True)
        
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        logger.info(f"Successfully extracted content from URL: {url}")
        return text[:2000]
    except Exception as e:
        logger.error(f"Error scraping {url}: {str(e)}")
        return ""

def process_prompt(user_prompt):
    try:
        search_queries = generate_search_queries(user_prompt)

        scraped_contents = []
        for query in search_queries:
            search_result = google_search(query)
            logger.info(f"Google API response for query '{query}': {json.dumps(search_result, indent=2)}")
            
            for item in search_result.get('items', []):
                if len(scraped_contents) >= 6:
                    break
                url = item['link']
                content = get_page_content(url)
                scraped_contents.append({"url": url, "content": content})
            
            if len(scraped_contents) >= 6:
                break

        context = "\n\n".join([f"Content from {item['url']}:\n{item['content']}" for item in scraped_contents])

        system_prompt = """You are an AI assistant specialized in due diligence for mergers and acquisitions. Here's the context for your analysis:

        [Your existing system prompt content goes here]

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

        result = {
            "search_queries": search_queries,
            "due_diligence_points": due_diligence_points["due_diligence_points"],
            "helpful_links": due_diligence_points.get("helpful_links", []),
            "scraped_contents": [{"url": item['url'], "content": item['content']} for item in scraped_contents]
        }

        logger.info("Successfully processed prompt and generated response")
        return result
    except Exception as e:
        logger.error(f"Error in process_prompt: {str(e)}")
        return {"error": "An unexpected error occurred", "details": str(e)}

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        user_prompt = data.get('prompt')
        if not user_prompt:
            self.send_error(400, "Missing 'prompt' in request body")
            return

        result = process_prompt(user_prompt)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode('utf-8'))

def handler(request, response):
    if request.method == 'POST':
        Handler.do_POST(Handler('', '', ''))
    else:
        response.status = 405
        response.body = "Method Not Allowed"