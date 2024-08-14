import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Adjust the import path as needed
import './Authentication.css'

const SocietyCodeInput = ({ onChange }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [societyName, setSocietyName] = useState('');
  const inputs = useRef([]);

  useEffect(() => {
    const fullCode = code.join('');
    onChange(fullCode);
    console.log(fullCode)
    const checkSocietyCode = async () => {
      if (fullCode.length === 6) {
        try {
          const { data, error } = await supabase
            .from('societies')
            .select('name')
            .eq('code', fullCode)
            .single();

          if (error) throw error;

          if (data) {
            setSocietyName(data.name);
          } else {
            setSocietyName('');
          }
        } catch (error) {
          console.error('Error checking society code:', error);
          setSocietyName('');
        }
      } else {
        setSocietyName('');
      }
    };

    checkSocietyCode();
  }, [code, onChange]);

  const handleChange = (element, index) => {
    const value = element.value.toUpperCase();
    if (!/^[A-Z0-9]$/.test(value)) return false;

    setCode([...code.map((d, idx) => (idx === index ? value : d))]);

    // Focus next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move focus to the previous input on backspace
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 6).split('');
    setCode((prevCode) => {
      const newCode = [...prevCode];
      pastedData.forEach((char, index) => {
        if (index < 6 && /^[A-Z0-9]$/.test(char)) {
          newCode[index] = char;
        }
      });
      return newCode;
    });
    if (inputs.current[5]) {
      inputs.current[5].focus();
    }
  };

  return (
    <div>
      <div className="society-code-input">
        {code.map((data, index) => (
          <input
            className="code-input"
            type="text"
            maxLength="1"
            key={index}
            value={data}
            ref={(ref) => inputs.current[index] = ref}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {societyName && (
        <p className="society-name">{societyName}</p>
      )}
    </div>
  );
};

export default SocietyCodeInput;