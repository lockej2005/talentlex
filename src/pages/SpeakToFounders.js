import React, { useState, useEffect, useRef } from 'react';
import { Linkedin, Twitter, Mail, Phone, Send } from 'lucide-react';
import { supabase } from '../supabaseClient'; // Adjust the import path as needed
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

const ChatMessage = ({ message, isUser }) => (
  <div className={`chat-message ${isUser ? 'user' : 'support'}`}>
    <p>{message.message}</p>
    <small>{new Date(message.created_at).toLocaleString()}</small>
  </div>
);

const ChatArea = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBoxRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchMessages(); // Refetch all messages to maintain correct order
          } else if (payload.eventType === 'DELETE') {
            setMessages((currentMessages) =>
              currentMessages.filter((message) => message.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) // Most recent first
      .limit(50);
    
    if (error) console.error('Error fetching messages:', error);
    else setMessages(data || []);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert([
        { user_id: userId, message: newMessage, sender: 'user' }
      ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      fetchMessages(); // Refetch messages to get the updated list with correct ordering
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-messages" ref={chatBoxRef}>
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} isUser={message.sender === 'user'} />
        ))}
      </div>
      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
        />
        <button type="submit"><Send size={20} /></button>
      </form>
    </div>
  );
};

const SpeakToFounders = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUserId();
  }, []);

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
          <h2 className="chat-title">Chat with the Founders</h2>
      <p className="chat-intro">Please let us know if you ran into an error. Send a message here and we will respond in a few hours.</p>
      {userId && <ChatArea userId={userId} />}
      <br></br>
      <div className='seperator2'></div>
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