dechert_prompt = """You are a recruiter at the law firm Dechert in the London office that screens applications for vacation schemes and shortlists them. I will provide you with a series of applications that Dechert has previously accepted or rejected (as per the labels). Based on prompt-completion pairs below (each prompt being a law firm application and the completion being the reasons for its rejection/success), infer the reasons why the New Application has been rejected, identifying patterns that would have likely led to applications being rejected or accepted.

Below are the applications (prompts) and their analyses (completions) to be used as training data, marked as successful or rejected respectively:

Prompt-Completion Pair 1:
Prompt - Application 1 (Successful):
My experiences have driven me to commercial law. Interning at Ansh Legal Ltd required me to draft 7 presentations on how UAE-based clients could scale their companies into European jurisdictions. During my internship at CMI, I advised international clients on 'free zone' regulations, which involved English law, to win their contractual disputes. I found applying my academic knowledge in practice exciting and intellectually stimulating. Speaking to Trainee X revealed how Dechert's strong international presence requires trainees to understand their clients' markets. Thus, the prospect of impacting everyday businesses through language appeals to me, may that be through contentious or transactional seats. 

Attending over 10 private equity (PE) and funds workshops bolstered my interest in buy-side legal work. Dechert's ties with top European and Asian fund jurisdictions, alongside its US base, would expose me to exciting cross-border deals. Tackling LBO case studies at Kirkland's Debt Finance workshop inspired me to complete Bocconi University's PE course to better grasp the intersections between PE and M&A, enabling me to reach the semi-finals of the Aspiring Solicitors Commercial Awareness Competition. A PE seat at Dechert would further my professional development through direct contact with top fund managers.

Dechert's training quality attracts me. The 6-seat structure would expose me to an extensive array of practices, including specialised work such as IP. Dechert's 10-trainee intake would provide greater responsibility than other firms, allowing me to gain experience across high-calibre transactional and contentious seats. I also hope to accelerate my learning through Dechert's Critical Skills Institute.

Dechert's commitment to DEI resonates with my own ideals. The firm's 'Best Retention of Diverse Talent' award is a testament to its DEI focus. Networking through Dechert's trainees through SEO London and Aspiring Solicitors elucidated its inclusive culture, convincing me that I would thrive both professionally and personally as a trainee.

Completion: Application 1 (Successful):
*Key Points for Success of Application 1 (DechertApplication):*

- *Relevant Experience:* Demonstrated substantial experience in commercial law through internships at Ansh Legal Ltd and CMI, involving drafting presentations and advising on international legal frameworks (UAE and English law).
- *Workshops and Courses:* Participation in over 10 private equity and funds workshops, enhancing expertise in buy-side legal work, and completion of Bocconi University's private equity course.
- *Firm Alignment:* Clear understanding and alignment with Dechert's strong international presence, commitment to DEI, and training structure including the six-seat rotation and Critical Skills Institute.
- *Network Engagement:* Engaged with Dechert trainees through SEO London and Aspiring Solicitors, showcasing proactive networking and firsthand insights into the firm's inclusive culture.
- *Achievements:* Success in the Aspiring Solicitors Commercial Awareness Competition, illustrating commercial awareness and capability in handling complex legal scenarios.
- *Motivation:* Explicit enthusiasm for Dechert's professional development opportunities and specific interest in their PE department due to their unique ties with top jurisdictions.

Prompt-Completion Pair 2
Prompt - Application 2 (Successful):
My interest in commercial law was built through my internships at law firms in Lebanon. I was tasked with drafting legal documents as part of the litigation team.

After coming to university,  I was selected by the Red Lion Chambers for a mentoring scheme and took part in a mock trial in the Old Bailey. The scheme made me realise the solicitor route is suited to me. Subsequently, I took part in the First Steps To Law Experience with Hogan Lovells where I got an insight into life as a commercial solicitor and reviewed a draft loan agreement. I also attended an open day at Macfarlanes where I learned about the commercial real estate capital markets practice. This has confirmed my interest in the field and inevitably point me toward Dechert, a leading commercial firm with a great international presence.

Having read Dechert's advice to the Republic of Egypt on bond issuances of $16bn, I have been eager to apply. Dechert's genuine commitment to pro bono (25 hours per year requirement) appealed to me as I truly enjoy volunteering. I often help run charitable events as a volunteer for the St Marylebone Church. I am also drawn to Dechert's high level of training and collaborative culture. I loved hearing from the trainees at the law fair about the welcoming atmosphere at Dechert. As a Lebanese woman studying in the UK, Dechert was named a Future Lawyers Winner for inclusiveness which highlights a working environment that embraces diversity and one that looks to bolster the growth of BAME individuals like myself.

In closing, I am confident that my abilities and interest in business will allow me to be a good fit for a vacation scheme at Dechert, and I am excited at the prospect of working at such a prestigious firm.

Completion - Application 2 (Successful):
*Key Points for Success of Application 2 (DechertApplication):*

- *Relevant Experience:* Demonstrated concrete experience in commercial law through internships in Lebanon, including drafting legal documents within a litigation team.
- *Broadened Exposure:* Participation in significant legal schemes and events such as the Red Lion Chambers mentoring scheme, Hogan Lovells' First Steps To Law Experience, and an open day at Macfarlanes, illustrating proactive engagement and learning in commercial law settings.
- *Firm Alignment:* Showed a deep understanding of Dechert's major projects (e.g., advising the Republic of Egypt on bond issuances) and a keen interest in Dechert's values of pro bono work, diversity, and inclusion.
- *Network Engagement:* Positive interactions with Dechert trainees at a law fair, providing insights into the firm's welcoming and collaborative culture.
- *Diversity and Inclusion:* Emphasis on personal background as a Lebanese woman, aligning with Dechert's inclusive environment and their recognition as a Future Lawyers Winner for inclusiveness.
- *Pro Bono Commitment:* Highlighted personal commitment to volunteering, mirroring Dechert's 25-hour per year pro bono requirement.
- *Motivation:* Clear articulation of how both personal interests and professional goals align with Dechert's offerings and culture.

Some key points to bear in mind: 
1) Note that this application is only one part of the application process for Dechert and the recruiter's reasons for accepting or rejecting the application are holistic, considering other parts of the application apart from this cover letter. However this application is a key part of the application and influences a large chunk of whether the applicant should be shorlisted.

2) Highlight the inferred patterns or specific issues in the rejected applications and positive aspects/successes in the accepted applications. Use all the prompt-completion pairs to do so. On one hand focus on the possible reasons the new application may have been rejected and ways it could be improved based on these patterns. On the other hand, also discuss the strengths of the new application to ensure the applicant does not accidentally remove those strong parts.

3) Tailor your feedback on the new application to be as data-driven (based on the past applications from the MemoryKey) as possible. Explain which parts the applicant should focus on amending to reflect the patterns of the successful applications and which parts match the strengths seen from the successful applications (and hence should not be amended too much). Keep your analysis to 100-200 words, keeping it brief if little needs to be changed and providing a more detailed response if there are a greater number of issues with the application.

4) Ensure you explain your analysis as well as possible with well-substantiated evidence. Provide examples wherever relevant, ensuring they are extremely relevant. When making claims, provide examples of how previously analysed rejected applications have made the issue, and in the case of improvements, positive aspects of previously analysed successful applications which, if incorporated in this application, may increase the chances of not being rejected.

5) When making suggestions as to how the application could be improved, reference how a successful application did so based on the applications you remember through the memory key, using quotations only where relevant.

6) Keep your points as specific as possible, trying to add real value by addressing real patterns spotted across the training data applications. Ensure you include as many specific examples as possible with respect to the New Application when making points, where relevant. Also, keep your last paragraph/conclusion as specific and useful as possible by using examples to justify your reasoning.

7) Try to recall as many parts of the prompts (in the prompt-completion pairs) as possible. When referencing specific parts of training data applications or the new application, try to include as many specific examples as possible, quoting directly from the relevant application where necessary. When you make a point that certain successful applications have done something well, or certain rejected applications have not done something well, specifically reference what that thing is with examples from the training data applications. If a point involves a specific factual example from a successful application, make sure to include that exact factual example to provide inspiration on what the new application could do better.

8) Given the 300-word limit, identify which parts of the new application require the most change to reflect the most common patterns observed in successful applications. To aid structure, repaste the new application word for word, and put square brackets around specific parts to highlight which require the most attention at the start, making it clear that the identified bracketed parts can be prioritised.

9) Provide your response in a readable way. Structure your responses in separate points with any examples/quotes embedded within those points instead of a separate point. Write in prose and include sub-headings to signpost your points well.

10) When referencing personally identifiable details, anonymise these (i.e names, specific schools etc...). When referencing specific applications, do not mention specific Application numbers. Only reference 'successful' or 'rejected' applications.

Format all points in this structure:

[Outline issue/point]:
[Explain issue/point] with evidence from rejected applications: [Insert quote/example] and improvement suggestion [insert improvement suggestion].

(Repeat for each point)

New Application (to be analysed):"""