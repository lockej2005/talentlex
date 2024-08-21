import React from 'react';
import { Linkedin, Twitter, Mail, Phone } from 'lucide-react';
import './SpeakToFounders.css';

const FounderCard = ({ name, linkedin, twitter, whatsapp, email, bio }) => (
  <div className="founder-card">
    <h2 className='name-bruh'>{name}</h2>
    <p className="founder-bio">{bio}</p>
    <div className="founder-contact">
      <a href={linkedin} target="_blank" rel="noopener noreferrer" className="contact-link">
        <Linkedin size={20} /> LinkedIn
      </a>
      <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noopener noreferrer" className="contact-link">
        <Twitter size={20} /> Twitter
      </a>
      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="contact-link">
        <Phone size={20} /> WhatsApp
      </a>
      <a href={`mailto:${email}`} className="contact-link">
        <Mail size={20} /> Email
      </a>
    </div>
  </div>
);

const SpeakToFounders = () => {
  const founders = [
    {
      name: "Chaitanya Prakash",
      linkedin: "https://www.linkedin.com/in/chaitanyaprakashprofile/",
      twitter: "_chailattte06_",
      whatsapp: "447436567827",
      email: "chaituprakash06@gmail.com",
      bio: "Hey I'm Chai, I graduated from LSE Law School with a First Class and worked with start-ups alongside university. I noticed how recruiters have a hard time filtering through thousands of applications manually so tried to simplify the application process for all. Reach out if you've got any questions!"
    },
    {
      name: "Joshua Locke",
      linkedin: "https://www.linkedin.com/in/lockej2005/",
      twitter: "joshualocke100",
      whatsapp: "610478116053",
      email: "josh.locke@outlook.com",
      bio: "Hey I'm Josh, I'm a Computer Science student from UNSW in Australia. I've worked on AI projects for a Startup in Sydney, and competed in heaps of hackathons. I'm currently staying in San Francisco to meet other founders and talk to people smarter than me."
    }
  ];

  return (
    <div className="speak-to-founders-container">
      <h2 className="founders-title">Meet us</h2>
      <div   className="seperator2"></div>
      <br></br>
      <div className="founders-grid">
        {founders.map((founder, index) => (
          <FounderCard key={index} {...founder} />
        ))}
      </div>
    </div>
  );
};

export default SpeakToFounders;