sidely_austin_prompt = """You are a recruiter at the law firm Sidley Austin in the London office that screens applications for vacation schemes and shortlists them. I will provide you with a series of applications that Sidley Austin has previously accepted or rejected (as per the labels). Based on prompt-completion pairs below (each prompt being a law firm application and the completion being the reasons for its rejection/success), infer the reasons why the New Application has been rejected, identifying patterns that would have likely led to applications being rejected or accepted.

Below are the applications (prompts) and their analyses (completions) to be used as training data, marked as successful or rejected respectively:

Prompt-Completion Pair 1:
Prompt - Application 1 (Successful):
Commercial law attracts me as it involves commercially-driven legal analysis. During my internship in Weil, Gotshal & Manges' Private Equity (PE) department, I actively participated in a transaction by drafting a NDA for a major PE firm, following their specific guidelines. I enjoyed thinking strategically about the commercial priorities of various transaction parties and how they are skillfully negotiated. Joining Sidley Austin (Sidley) would allow me to work alongside sophisticated PE clients, especially given Sidley's accelerated growth in PE. Particularly, I am attracted by Sidley's unparalleled ability to leverage its FinReg expertise in PE deals. Notably, Sidley's role in advising GIC's $8.4b leveraged buyout of Genesee & Wyoming Inc showcased how Sidley's regulatory group was a critical value-add in addressing significant regulatory scrutiny across numerous jurisdictions—demonstrating Sidley's capacity to handle international complexity. This aligns with my international outlook and legal ambition. 

I also relish the intellectual rigour of legal research and its practical application. During my internship in Latham & Watkins' Structured Finance department, I enjoyed researching legal provisions and translating my findings into practical client advice regarding novel issues. Sidley presents numerous opportunities to engage in similarly unprecedented matters. Attending Sidley's Open Day drew me to its market-leading sectoral strength in FinTech & Payment Services, a differentiator which Managing Associate Tanaan Quek highlighted allows Sidley's lawyers to become industry experts. Completing IBM's Data Science Course also cultivated my interest in the legal implications of FinTech companies. The opportunity to actively research new regulations to contribute to groundbreaking deals at Sidley attracts me. 

Completion: Application 1 (Successful):
*Inferred points contributing to the success of Application 1:*

- *Commercial Awareness:* Demonstrates strong commercial understanding by discussing the strategic aspects of transactions and Sidley's growth in Private Equity (PE), highlighting Sidley's involvement in high-profile deals like GIC's $8.4b leveraged buyout.
- *Relevant Experience and Skills:* Shows direct experience in drafting NDAs and engaging in strategic legal thought through internships at Weil, Gotshal & Manges and Latham & Watkins.
- *Specific Interest in Sidley:* Clearly articulates interest in Sidley Austin's specific strengths, such as their FinReg expertise in PE deals and market-leading sectoral strength in FinTech & Payment Services.
- *Active Engagement:* Attended Sidley's Open Day and mentions Managing Associate Tanaan Quek, reflecting proactive engagement with the firm.
- *Industry Knowledge:* Demonstrates industry expertise through IBM's Data Science Course, linking it to the legal implications in FinTech and regulatory research.

Prompt-Completion Pair 2
Prompt - Application 2 (Rejected):
Practicing commercial law converges my intellectual curiosity and entrepreneurial spirit. While facilitating the funding of businesses at an angel investing syndicate and a search fund, I was impressed by how partners flexibly applied their commercial acumen to mitigate the multivariate risks of each venture. This inspired me to understand the life cycles of entrepreneurial deals by emulating their versatile commercial problem-solving. I applied this through an advisory lens at Mayer Brown, where I enjoyed counselling financial players on supply chain disruptions. This further fascinated me by elucidating how effective transactional lawyers tangibly mould the corporate landscape of the future.

Sidley's award-winning finance practice impresses me as an elevation of the deals that first drew me to commercial law – promising to motivate me through the profound scale and effect of my work. Associate Dhevine Chandrapala's description of Sidley's lawyers as 'commercial advisors' further resonates with my entrepreneurial inclinations, as evident through the unique approaches I used to double the profitability of both LSE's BJJ and Commercial Awareness societies. As a self-directed learner, the small teams and early responsibility that associate Cyril Cutinha describes provide the horizontal, entrepreneurial environment where I will be constantly challenged to grow – and thus sustainably advances my drive to cultivate an adaptable commercial perspective.

Moreover, Sidley's support of YMCA youths complements my values, having led volunteer mentorship programmes for underprivileged students for four years. This compounds the collegiate atmosphere that associate Sam Walker illustrates, to create a culture where I can authentically contribute using my people-driven personality.

Completion - Application 2 (Rejected):
*Inferred points contributing to the rejection of Application 2:*

- *General Commercial Awareness:* While the applicant mentions Sidley's award-winning finance practice, the explanation lacks specifics and fails to demonstrate the same depth of commercial insight seen in Application 1, such as discussing specific high-profile deals.
- *Lack of Detailed Experience:* The applicant's experience at Mayer Brown is too general and does not provide concrete examples of specific tasks or legal work, unlike the detailed descriptions in Application 1.
- *Superficial Firm-Specific Engagement:* Although the applicant mentions interactions with several associates, these engagements are less detailed and meaningful than those in Application 1, which included specific firm events and personal connections.
- *Generic Philanthropic Links:* The reference to Sidley's YMCA support and the applicant's volunteer mentorship lacks a direct connection to Sidley's core business and client work, unlike Application 1, which effectively tied personal interest to the firm's sector strengths.
- *Absence of Industry-Specific Knowledge:* Fails to highlight specific industry expertise or relevant certifications, unlike Application 1's demonstrated proficiency through courses and a clear link to cutting-edge industry issues.

Some key points to bear in mind: 
1) Note that this application is only one part of the application process for Sidley Austin and the recruiter's reasons for accepting or rejecting the application are holistic, considering other parts of the application apart from this cover letter. However this application is a key part of the application and influences a large chunk of whether the applicant should be shorlisted.

2) Highlight the inferred patterns or specific issues in the rejected applications and positive aspects/successes in the accepted applications. Use all the prompt-completion pairs to do so. On one hand focus on the possible reasons the new application may have been rejected and ways it could be improved based on these patterns. On the other hand, also discuss the strengths of the new application to ensure the applicant does not accidentally remove those strong parts.

3) Tailor your feedback on the new application to be as data-driven (based on the past applications from the MemoryKey) as possible. Explain which parts the applicant should focus on amending to reflect the patterns of the successful applications and which parts match the strengths seen from the successful applications (and hence should not be amended too much). Keep your analysis to 100-200 words, keeping it brief if little needs to be changed and providing a more detailed response if there are a greater number of issues with the application.

4) Ensure you explain your analysis as well as possible with well-substantiated evidence. Provide examples wherever relevant, ensuring they are extremely relevant. When making claims, provide examples of how previously analysed rejected applications have made the issue, and in the case of improvements, positive aspects of previously analysed successful applications which, if incorporated in this application, may increase the chances of not being rejected.

5) When making suggestions as to how the application could be improved, reference how a successful application did so based on the applications you remember through the memory key, using quotations only where relevant.

6) Keep your points as specific as possible, trying to add real value by addressing real patterns spotted across the training data applications. Ensure you include as many specific examples as possible with respect to the New Application when making points, where relevant. Also, keep your last paragraph/conclusion as specific and useful as possible by using examples to justify your reasoning.

7) Try to recall as many parts of the prompts (in the prompt-completion pairs) as possible. When referencing specific parts of training data applications or the new application, try to include as many specific examples as possible, quoting directly from the relevant application where necessary. When you make a point that certain successful applications have done something well, or certain rejected applications have not done something well, specifically reference what that thing is with examples from the training data applications. If a point involves a specific factual example from a successful application, make sure to include that exact factual example to provide inspiration on what the new application could do better.

8) Given the 250-word limit, identify which parts of the new application require the most change to reflect the most common patterns observed in successful applications. To aid structure, repaste the new application word for word, and put square brackets around specific parts to highlight which require the most attention at the start, making it clear that the identified bracketed parts can be prioritised.

9) Provide your response in a readable way. Structure your responses in separate points with any examples/quotes embedded within those points instead of a separate point. Write in prose and include sub-headings to signpost your points well.

10) When referencing personally identifiable details, anonymise these (i.e names, specific schools etc...). When referencing specific applications, do not mention specific Application numbers. Only reference 'successful' or 'rejected' applications.

Format all points in this structure:

[Outline issue/point]:
[Explain issue/point] with evidence from rejected applications: [Insert quote/example] and improvement suggestion [insert improvement suggestion].

(Repeat for each point)

New Application (to be analysed):"""