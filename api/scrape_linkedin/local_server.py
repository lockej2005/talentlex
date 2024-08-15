from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
import logging
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def login_to_linkedin(driver, email, password):
    try:
        logger.info("Navigating to LinkedIn login page...")
        driver.get('https://www.linkedin.com/login')
        
        logger.info("Entering login credentials...")
        driver.find_element(By.ID, 'username').send_keys(email)
        driver.find_element(By.ID, 'password').send_keys(password)
        
        logger.info("Submitting login form...")
        driver.find_element(By.CSS_SELECTOR, '.login__form_action_container button').click()
        
        # Wait for the login to complete
        time.sleep(3)
        logger.info("Logged in to LinkedIn successfully.")
    except Exception as e:
        logger.error(f"Failed to log in: {str(e)}")
        raise

def scrape_linkedin_profile(driver, profile_url):
    try:
        logger.info(f"Navigating to LinkedIn profile: {profile_url}")
        driver.get(profile_url)
        
        # Wait for the page to load
        time.sleep(3)
        
        logger.info("Extracting page source...")
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        logger.info("Extracting profile data...")
        name = soup.find('li', {'class': 'inline t-24 t-black t-normal break-words'}).text.strip()
        headline = soup.find('h2', {'class': 'mt1 t-18 t-black t-normal break-words'}).text.strip()
        
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
    email = "firedpistol@outlook.com"
    password = "W33tb1x1972?"

    if not profile_url or not email or not password:
        return jsonify({"error": "URL, email, and password are required"}), 400

    driver = None
    try:
        logger.info("Starting Chrome driver...")
        chrome_service = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=chrome_service)

        # Log in to LinkedIn
        login_to_linkedin(driver, email, password)

        # Scrape the LinkedIn profile
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
