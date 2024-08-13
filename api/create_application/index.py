from http.server import BaseHTTPRequestHandler
from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def read_prompt(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), 'r') as file:
        return file.read()

goodwin_draft = read_prompt('goodwin_draft.txt')
system_prompt = goodwin_draft

def handler(event, context):
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
                'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
            },
            'body': ''
        }

    if event['httpMethod'] != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method Not Allowed'})
        }

    try:
        body = json.loads(event['body'])
        firm = body.get('firm')
        question = body.get('question')
        key_reasons = body.get('keyReasons')
        relevant_experience = body.get('relevantExperience')
        relevant_interaction = body.get('relevantInteraction')
        personal_info = body.get('personalInfo')

        if not firm or not question:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required data'})
            }

        prompt = f"""
        Generate a draft application for {firm} addressing the following question:
        "{question}"

        Include the following information in your response:
        - Key reason(s) for applying: {key_reasons}
        - Relevant experience: {relevant_experience}
        - Relevant interaction with the firm: {relevant_interaction}
        - Additional personal information: {personal_info}

        Please create a well-structured, professional application that incorporates all the provided information seamlessly.
        """

        completion = client.chat.completions.create(
            model="ft:gpt-4o-mini-2024-07-18:personal:appdrafterdataset:9vG3pVmA",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )

        generated_draft = completion.choices[0].message.content

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'draft': generated_draft
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }