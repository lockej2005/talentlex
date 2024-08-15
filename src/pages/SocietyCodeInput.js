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
    if (value === '' || /^[A-Z0-9]$/.test(value)) {
      setCode(prevCode => {
        const newCode = [...prevCode];
        newCode[index] = value;
        return newCode;
      });

      // Focus next input if a character was entered
      if (value !== '' && element.nextSibling) {
        element.nextSibling.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setCode(prevCode => {
        const newCode = [...prevCode];
        newCode[index] = '';
        return newCode;
      });

      // Move focus to the previous input on backspace
      if (index > 0) {
        inputs.current[index - 1].focus();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      setCode(prevCode => {
        const newCode = [...prevCode];
        newCode[index] = '';
        return newCode;
      });
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputs.current[index + 1].focus();
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