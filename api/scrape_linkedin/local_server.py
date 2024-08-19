from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import logging
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def set_cookies(driver, cookies):
    logger.info("Setting cookies...")
    for cookie in cookies:
        driver.add_cookie(cookie)
    logger.info("Cookies set successfully.")

def scrape_linkedin_profile(driver, profile_url):
    try:
        logger.info(f"Navigating to LinkedIn profile: {profile_url}")
        driver.get(profile_url)
        
        # Wait for the page to load
        time.sleep(5)
        
        logger.info("Extracting page source...")
        page_source = driver.page_source
        
        # Optional: Save the page source to a file for inspection
        with open("linkedin_profile.html", "w", encoding="utf-8") as file:
            file.write(page_source)
        
        soup = BeautifulSoup(page_source, 'html.parser')
        
        logger.info("Extracting profile data...")
        name_element = soup.find('li', {'class': 'inline t-24 t-black t-normal break-words'})
        headline_element = soup.find('h2', {'class': 'mt1 t-18 t-black t-normal break-words'})
        
        # Check if elements are found before accessing text
        name = name_element.text.strip() if name_element else "Name not found"
        headline = headline_element.text.strip() if headline_element else "Headline not found"
        
        # Example: Extract additional data as needed
        experience_section = soup.find('section', {'id': 'experience-section'})
        experience = []
        if experience_section:
            positions = experience_section.find_all('li', {'class': 'pv-entity__position-group-pager'})
            for position in positions:
                company = position.find('p', {'class': 'pv-entity__secondary-title'}).text.strip() if position.find('p', {'class': 'pv-entity__secondary-title'}) else "Company not found"
                role = position.find('h3', {'class': 't-16 t-black t-bold'}).text.strip() if position.find('h3', {'class': 't-16 t-black t-bold'}) else "Role not found"
                experience.append({"company": company, "role": role})
        
        # Return extracted data
        profile_data = {
            "name": name,
            "headline": headline,
            "experience": experience
        }
        logger.info(f"Profile data extracted: {profile_data}")
        return profile_data
    except Exception as e:
        logger.error(f"Failed to scrape profile: {str(e)}")
        raise

@app.route('/api/scrape_linkedin', methods=['POST'])
def handle_scrape():
    data = request.json
    profile_url = data.get('url')
    
    if not profile_url:
        return jsonify({"error": "URL is required"}), 400

    # Example session cookies (replace with your actual cookies)
    cookies = [
        {"name": "li_at", "value": "YOUR_SESSION_COOKIE", "domain": ".linkedin.com"},
        # Add other relevant cookies if needed
    ]

    driver = None
    try:
        logger.info("Starting Chrome driver...")
        chrome_service = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=chrome_service)
        
        # Navigate to LinkedIn to set the cookies
        driver.get('https://www.linkedin.com')
        set_cookies(driver, cookies)
        
        # Navigate to the profile after setting cookies
        profile_data = scrape_linkedin_profile(driver, profile_url)
        
        return jsonify(profile_data)

    except Exception as e:
        logger.error(f"Error during scraping: {str(e)}")
        return jsonify({"error": str(e)}), 500

    finally:
        if driver:
            logger.info("Closing browser...")
            driver.quit()

if __name__ == '__main__':
    logger.info("Starting Flask app...")
    app.run(debug=True)
