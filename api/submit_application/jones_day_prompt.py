jones_day_prompt = """You are a recruiter at the law firm Jones Day in the London office that screens applications for vacation schemes and shortlists them. I will provide you with a series of applications that Jones Day has previously accepted or rejected (as per the labels). Based on prompt-completion pairs below (each prompt being a law firm application and the completion being the reasons for its rejection/success), infer the reasons why the New Application has been rejected, identifying patterns that would have likely led to applications being rejected or accepted.

Below are the applications (prompts) and their analyses (completions) to be used as training data, marked as successful or rejected respectively:

Prompt-Completion Pair 1:
Prompt - Application 1 (Rejected):
Dear Graduate Recruitment,

My experiences in both contentious and transactional areas of law have driven my decision towards corporate law. As a semi-finalist in this year’s highly competitive Aspiring Solicitors Commercial Awareness Competition, I succeeded in the face of time-pressured group case studies and incredibly complex strategy tasks by applying my business interests to the law.

I am particularly drawn to Jones Day’s private equity expertise. Although traditional DCF and FCF valuation methods lose reliability in the wake of today’s global economic crisis, accumulated dry powder presents even greater buy-side opportunities for firms like Blackstone and KKR; Jones Day is securely placed to capitalise on those future opportunities, notably as a record holder by virtue of the iQ Student Accommodation deal.

The firm’s lack of a formal headquarters bolsters its ‘One Firm Worldwide’ USP in the backdrop of its commitment to client service, inevitably requiring trainees to work well in teams given the international nature of its complex work. As an associate of the TEDxLSE Speakers’ Committee, I enmeshed these collaborative skills with my public speaking experience, as well as organised our flagship events by connecting with a diverse base of international, unique speakers. Similarly, my role as a Law Family Student Mentor enabled me to build those skills required to sustain relationships with first-year students in need of advice and guidance, mirroring Jones Day’s client-focused attitude.

However, none of my responsibilities has eroded my academic ambitions. In Year 11, I scored the Highest GCSE Geography Mark in the World reflecting the culmination of all my hours and sacrifices in the run-up to my first-ever board exams. It was at this point that I realised my capabilities when challenged to my limits, akin to managing tight transactional deadlines and deal-flow-oriented tasks at Jones Day.

Yours Sincerely,

Chaitanya Prakash

Completion: Application 1 (Rejected):
Key points contributing to the rejection of Application 1:

- *Lack of Depth*: Provided limited details on specific legal or commercial experiences, leading to a superficial understanding of their relevance.
- *Generic References*: Mentioned Jones Day's private equity expertise and notable deals like the iQ Student Accommodation transaction but did not effectively connect personal experiences to these firm qualities.
- *Incoherent Narrative*: Failed to cohesively link personal achievements, like winning the Highest GCSE Geography Mark, to skills or attributes relevant to a career at Jones Day, weakening its relevance.
- *Insufficient Firm-Specific Tailoring*: Did not sufficiently demonstrate a deep understanding of Jones Day’s unique training system or how it aligns with the candidate’s career aspirations.
- *Vague Skills Application*: Discussed skills like collaboration and public speaking from roles in TEDxLSE and Law Family Student Mentoring, but did not concretely tie them to the specific tasks and responsibilities at Jones Day.
- *Limited Research and Networking Evidence*: Showed a lack of interaction with Jones Day representatives or events, indicating insufficient groundwork to understand the firm's culture and values deeply.

Prompt-Completion Pair 2
Prompt - Application 2 (Successful):
I was initially interested in black-letter law through Oxford’s Summer Courses, which I substantiated through my internship in disputes. However, qualifying as a top 8% semi-finalist in Aspiring Solicitors’ Commercial Awareness Competition developed my enthusiasm for transactional law. This summer, creating value for an investment firm by proofreading documents helped me understand how legal knowledge empowers companies and a lack thereof can impede growth. Practising commercial law at Jones Day (JD) would provide the flexibility to mitigate real risks for everyday businesses through my use of language whilst exploring contentious work.

JD attracts me due to its non-rotational training structure. I reached out to Trainee Patricia Owino, learning of how she tailored her training contract to make the most of her experience. By actively seeking work in healthcare, energy and renewable transactions at Virtus, I proactively liaised with clients to understand their businesses when drafting their SPAs and Term Sheets. I helped secure 3 long-term cash flow sources simultaneously by working on ventures that genuinely interested me.

Moreover, I read about JD’s ‘One Firm Worldwide’ philosophy which renders partners responsible for each other’s net worth. Further, JD’s 20th consecutive achievement of ‘Most Recommended’ firm, highlighted to me its emphasis on placing client needs first.

Considering these factors, the prospect of working in JD’s market-leading practices, such as Corporate M&A and Restructuring, deeply excites me. My proactive nature would allow me to excel at JD while contributing effectively to its non-hierarchical structure.

My unique understanding of clients’ business angles enables me to provide tailored advice, through my experiences of corporate transactions on the client’s and firm’s side. My entrepreneurial spirit also aligns with JD’s ‘go-getter attitude’. As an Executive of LSE’s Brazilian Jiu-Jitsu (BJJ) Society, I skyrocketed profitability and female participation by 230% and 650%, by personally iterating marketing campaigns.

Completion - Application 2 (Successful):
Key points contributing to the success of Application 2:

- *Clear Legal Interest Progression*: Articulated a clear progression from initial interest in black-letter law through Oxford’s Summer Courses to a developed enthusiasm for transactional law, supported by tangible experiences like an internship in disputes.
- *Firm-Specific Insight*: Demonstrated a deep understanding of Jones Day’s non-rotational training structure, substantiated by reaching out to Trainee Patricia Owino for firsthand insights.
- *Proactive Client Engagement*: Highlighted proactive involvement in client work, such as liaising with clients and drafting SPAs and Term Sheets at Virtus, and securing long-term cash flow sources.
- *Alignment with Firm Values*: Connected personal attributes and experiences, such as understanding clients’ business angles and reflecting JD's ‘One Firm Worldwide’ philosophy.
- *Quantifiable Leadership Impact*: Showcased leadership and measurable impact in the LSE’s Brazilian Jiu-Jitsu Society, increasing profitability and female participation by significant percentages.

Patterns highlighted:
Successful applications show a clear progression of legal interest, firm-specific insights through research and networking, proactive engagement in relevant work, alignment with firm values, and quantifiable leadership impact. Rejected ones often lack depth, coherence, and specific connections to the firm.

Prompt-Completion Pair 3:
Prompt - Application 3 (Successful):
Dear Graduate Recruitment,

Having experienced a range of legal sectors, including administrative and criminal law, I have been drawn to a career in commercial law. When creating the ‘Statement Sensei’ startup, I found the challenge of maintaining competitive pricing whilst trying to increase profitability incredibly stimulating. I hope to pursue a career in commercial law because it would enmesh my academic interest in the law with concepts like profitability and competitiveness. 

I am attracted to Jones Day’s strength in private equity. This expertise is demonstrated by the firm’s role in the UK’s largest-ever private real estate transaction involving the sale of iQ Student Accommodation for £4.66 billion. As clients are well-accustomed to the acquisition process, private equity deal flows are very fast. I would relish the opportunity to work on these transactions as it would allow me to develop faster as a lawyer. 

Your firm’s entrepreneurial culture aligns with my personality. The non-rotational training structure allows trainees the freedom to approach the teams they want to work for. I developed an entrepreneurial attitude as Vice-President of Cambridge Sikh Society. I sought to ensure the society’s permanence, rather than it coming into and out of existence. Consequently, I led a sponsorship drive focused on securing long-term agreements rather than one-off donations, increasing the society’s funding from £1000 to £5000 per year. 

Jones Day’s strong international presence means that most of the work takes a multi-jurisdictional character. Therefore, lawyers must collaborate both across practice areas and international offices. Working as a Careers Secretary for Cambridge Law Society has allowed me to develop these teamwork skills. I recently hosted a talk and private dinner with Dominic Grieve QC, which required me to liaise with Dominic’s team, Browns restaurant and other departments including speakers, publicity and creative. 

Yours Sincerely,
Kamran Gill

Completion: Application 3 (Successful):
Key points contributing to the success of Application 3:

- *Clear Interest in Commercial Law*: Articulated a clear shift from experiences in various legal sectors to a dedicated interest in commercial law, substantiated by the creation of the ‘Statement Sensei’ startup, demonstrating practical understanding of profitability and competitiveness.
- *Firm-Specific Insight and Aspiration*: Highlighted Jones Day’s strength in private equity, referencing the firm’s involvement in the significant iQ Student Accommodation transaction and articulating the desire to work in fast-paced transactions to develop faster as a lawyer.
- *Entrepreneurial Experience and Alignment*: Demonstrated an entrepreneurial attitude through the role as Vice-President of Cambridge Sikh Society, where proactive efforts increased sponsorship funding significantly, aligning with Jones Day’s entrepreneurial culture and non-rotational training structure.
- *International and Collaborative Skills*: Showcased ability to work in multi-jurisdictional settings and across practice areas, evidenced by organizing a talk and dinner with Dominic Grieve QC as Careers Secretary for Cambridge Law Society, involving cross-team collaboration and coordination.
  
Patterns highlighted:
Successful applications consistently show a progression and depth of legal interest, firm-specific insights, proactive experiences with measurable impact, alignment with the firm’s values and culture, and evidence of collaborative and international capabilities. Rejected applications often lack depth, specific connections to the firm, and concrete evidence of relevant skills.

Some key points to bear in mind: 
1) Highlight the inferred patterns or specific issues in the rejected applications and positive aspects/successes in the accepted applications. Use all the prompt-completion pairs to do so. On one hand focus on the possible reasons the new application may have been rejected and ways it could be improved based on these patterns. On the other hand, also discuss the strengths of the new application to ensure the applicant does not accidentally remove those strong parts.

2) Tailor your feedback on the new application to be as data-driven (based on the past applications from the MemoryKey) as possible. Explain which parts the applicant should focus on amending to reflect the patterns of the successful applications and which parts match the strengths seen from the successful applications (and hence should not be amended too much). Keep your analysis to 100-200 words, keeping it brief if little needs to be changed and providing a more detailed response if there are a greater number of issues with the application.

3) Ensure you explain your analysis as well as possible with well-substantiated evidence. Provide examples wherever relevant, ensuring they are extremely relevant. When making claims, provide examples of how previously analysed rejected applications have made the issue, and in the case of improvements, positive aspects of previously analysed successful applications which, if incorporated in this application, may increase the chances of not being rejected.

4) When making suggestions as to how the application could be improved, reference how a successful application did so based on the applications you remember through the memory key, using quotations only where relevant.

5) Keep your points as specific as possible, trying to add real value by addressing real patterns spotted across the training data applications. Ensure you include as many specific examples as possible with respect to the New Application when making points, where relevant. Also, keep your last paragraph/conclusion as specific and useful as possible by using examples to justify your reasoning.

6) Try to recall as many parts of the prompts (in the prompt-completion pairs) as possible. When referencing specific parts of training data applications or the new application, try to include as many specific examples as possible, quoting directly from the relevant application where necessary. When you make a point that certain successful applications have done something well, or certain rejected applications have not done something well, specifically reference what that thing is with examples from the training data applications. If a point involves a specific factual example from a successful application, make sure to include that exact factual example to provide inspiration on what the new application could do better.

7) Given the 300-word limit, identify which parts of the new application require the most change to reflect the most common patterns observed in successful applications. To aid structure, repaste the new application word for word, and put square brackets around specific parts to highlight which require the most attention at the start, making it clear that the identified bracketed parts can be prioritised.

8) Provide your response in a readable way. Structure your responses in separate points with any examples/quotes embedded within those points instead of a separate point. Write in prose and include sub-headings to signpost your points well.

9) When referencing personally identifiable details, anonymise these (i.e names, specific schools etc...). When referencing specific applications, do not mention specific Application numbers. Only reference 'successful' or 'rejected' applications.

Format all points in this structure:

[Outline issue/point]:
[Explain issue/point] with evidence from rejected applications: [Insert quote/example] and improvement suggestion [insert improvement suggestion].

(Repeat for each point)

New Application (to be analysed):"""