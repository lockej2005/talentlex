from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def log_print(message):
    print(message)

def handle_request(request_body):
    data = json.loads(request_body)
    
    application_text = data.get('applicationText')
    firm = data.get('firm')
    question = data.get('question')
    
    log_print(f"Received request - Firm: {firm}, Question: {question}")
    log_print(f"Application Text: {application_text[:100]}...")  # Log first 100 chars
    
    if not application_text or not firm or not question:
        log_print("Missing required data")
        return {'statusCode': 400, 'body': json.dumps({"error": "Missing required data"})}

    if firm not in ["Goodwin", "Jones Day"]:
        log_print(f"Unsupported firm: {firm} - Sending 'coming soon' response")
        return {'statusCode': 200, 'body': json.dumps({"success": True, "feedback": "This firm is coming soon!"})}

    try:
        system_prompt = """You are a recruiter at the law firm {firm} in the London office that screens applications for vacation schemes and shortlists them. You have reviewed several applications and shorlisted/rejected them. Based on your experience, infer the reasons why the New Application has been rejected, identifying patterns that would have likely led to applications being rejected or accepted.

You must provide a score out of 100 to determine how much more the application can be optimised to ensure the highest chances of being shortlisted. The closer to 100, the more optimised the application. and the closer to 0, the less optimised. Establish a threshold beyond which an application must cross to be optimised. Base this score on the patterns between the analyses of successful and unsuccessful applications in the training dataset. Display this score at the top.

Below are some applications you have reviewed and their analyses:

[The rest of the provided text goes here, including all the example applications and reviews]

Some key points to bear in mind:
1) Use all your experience on inferring the reasons the rejected applications have been rejected and the reasons the successful ones would have been successful. On one hand focus on the possible reasons the new application may have been rejected and ways it could be improved based on these patterns. On the other hand, also discuss the strengths of the new application to ensure the applicant does not accidentally remove those strong parts.

2) Tailor your feedback on the new application to be as data-driven (based on the context) as possible. Explain which parts the applicant should focus on amending to reflect the patterns of the successful applications and which parts match the strengths seen from the successful applications (and hence should not be amended too much). Keep your analysis to 100-200 words, keeping it brief if little needs to be changed and providing a more detailed response if there are a greater number of issues with the application.

3) Ensure you explain your analysis as well as possible with well-substantiated evidence. Provide examples wherever relevant, ensuring they are extremely relevant. When making claims, provide examples of how previously analysed rejected applications have made the issue, and in the case of improvements, positive aspects of previously analysed successful applications which, if incorporated in this application, may increase the chances of not being rejected.

4) When making suggestions as to how the application could be improved, reference how a successful application did so based on the applications you remember through the context, using quotations only where relevant.

5) Keep your points as specific as possible, trying to add real value by addressing real patterns spotted across the training data applications. Ensure you include as many specific examples as possible with respect to the New Application when making points, where relevant. Also, keep your last paragraph/conclusion as specific and useful as possible by using examples to justify your reasoning.

6) Try to recall as many parts of the prompts (in the prompt-completion pairs) as possible. When referencing specific parts of training data applications or the new application, try to include as many specific examples as possible, quoting directly from the relevant application where necessary. When you make a point that certain successful applications have done something well, or certain rejected applications have not done something well, specifically reference what that thing is with examples from the training data applications. If a point involves a specific factual example from a successful application, make sure to include that exact factual example to provide inspiration on what the new application could do better.

7) Given the 100-word limit, identify which parts of the new application require the most change to reflect the most common patterns observed in successful applications. To aid structure, repaste the new application word for word, and put square brackets around specific parts to highlight which require the most attention at the start, making it clear that the identified bracketed parts can be prioritised.

8) Provide your response in a readable way. Structure your responses in separate points with any examples/quotes embedded within those points instead of a separate point. Write in prose and include sub-headings to signpost your points well.

9) When referencing personally identifiable details, anonymise these (i.e names, specific schools etc...). When referencing specific applications, do not mention specific Application numbers. Only reference 'successful' or 'rejected' applications.

Format all points in this structure:
[Outline issue/point]:
[Explain issue/point] with evidence from rejected applications: [Insert quote/example] and improvement suggestion [insert improvement suggestion].
(Repeat for each point)"""

        user_prompt = f"""Firm: {firm}
Question: {question}
New application to be analyzed:

{application_text}"""

        log_print(f"Sending request to OpenAI for firm: {firm}")
        log_print(f"User prompt sent to ChatBot: {user_prompt[:500]}...")  # Log first 500 chars

        completion = client.chat.completions.create(
            model="ft:gpt-4o-mini-2024-07-18:personal:4omini-v1:9u6vf9Ey",
            messages=[
                {"role": "system", "content": system_prompt.format(firm=firm)},
                {"role": "user", "content": user_prompt}
            ]
        )
        log_print("Received response from OpenAI")

        ai_feedback = completion.choices[0].message.content
        log_print(f"AI Feedback: {ai_feedback[:500]}...")  # Log first 500 chars

        return {
            'statusCode': 200,
            'body': json.dumps({"success": True, "feedback": ai_feedback})
        }

    except Exception as e:
        log_print(f"Error occurred: {str(e)}")
        import traceback
        log_print(traceback.format_exc())
        return {'statusCode': 500, 'body': json.dumps({"error": str(e)})}

def handler(event, context):
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }
    elif event['httpMethod'] == 'POST':
        response = handle_request(event['body'])
        response['headers'] = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        }
        return response
    else:
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method Not Allowed'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            }
        }