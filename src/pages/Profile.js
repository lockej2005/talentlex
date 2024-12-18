import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient'; // Adjust the import path as needed
import './Profile.css';
import WelcomeMessage from './WelcomeMessage'; // Import the WelcomeMessage component

const Profile = () => {
  const [userId, setUserId] = useState(null);
  const [education, setEducation] = useState('');
  const [subCategories, setSubCategories] = useState('');
  const [years, setYears] = useState([
    { id: 1, name: 'Year 1', expanded: false, subjects: [{ name: '', grade: '' }] }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('education, sub_categories, undergraduate_grades')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setEducation(data.education || '');
        setSubCategories(data.sub_categories || '');
        if (data.undergraduate_grades) {
          const parsedGrades = parseUndergraduateGrades(data.undergraduate_grades);
          setYears(parsedGrades);
        }
      }
    }
  };

  const parseUndergraduateGrades = (gradesString) => {
    const yearRegex = /Year (\d+) - (.*?)(?=Year \d+|$)/g;
    const subjectRegex = /\[([^,]+),\s*(\d+)\]/g;
    const years = [];
    let match;

    while ((match = yearRegex.exec(gradesString)) !== null) {
      const yearNumber = parseInt(match[1]);
      const subjects = [];
      let subjectMatch;

      while ((subjectMatch = subjectRegex.exec(match[2])) !== null) {
        subjects.push({
          name: subjectMatch[1],
          grade: parseInt(subjectMatch[2])
        });
      }

      years.push({
        id: yearNumber,
        name: `Year ${yearNumber}`,
        expanded: false,
        subjects: subjects
      });
    }

    return years.length > 0 ? years : [{ id: 1, name: 'Year 1', expanded: false, subjects: [{ name: '', grade: '' }] }];
  };

  const formatUndergraduateGrades = () => {
    return years.map(year => {
      const subjectsString = year.subjects.map(subject => `[${subject.name}, ${subject.grade}]`).join(', ');
      return `Year ${year.id} - ${subjectsString}`;
    }).join(', ');
  };

  const saveProfile = async () => {
    if (!userId) return;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          education: education,
          sub_categories: subCategories,
          undergraduate_grades: formatUndergraduateGrades()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addYear = () => {
    const newYear = {
      id: years.length + 1,
      name: `Year ${years.length + 1}`,
      expanded: false,
      subjects: [{ name: '', grade: '' }]
    };
    setYears([...years, newYear]);
  };

  const addSubject = (yearId) => {
    const updatedYears = years.map(year => {
      if (year.id === yearId) {
        return {
          ...year,
          subjects: [...year.subjects, { name: '', grade: '' }]
        };
      }
      return year;
    });
    setYears(updatedYears);
  };

  const toggleYearExpansion = (yearId) => {
    const updatedYears = years.map(year => {
      if (year.id === yearId) {
        return { ...year, expanded: !year.expanded };
      }
      return year;
    });
    setYears(updatedYears);
  };

  const updateSubject = (yearId, subjectIndex, field, value) => {
    const updatedYears = years.map(year => {
      if (year.id === yearId) {
        const updatedSubjects = year.subjects.map((subject, index) => {
          if (index === subjectIndex) {
            return { ...subject, [field]: value };
          }
          return subject;
        });
        return { ...year, subjects: updatedSubjects };
      }
      return year;
    });
    setYears(updatedYears);
  };

  const deleteSubject = (yearId, subjectIndex) => {
    const updatedYears = years.map(year => {
      if (year.id === yearId) {
        const updatedSubjects = year.subjects.filter((_, index) => index !== subjectIndex);
        return { ...year, subjects: updatedSubjects };
      }
      return year;
    });
    setYears(updatedYears);
  };

  const deleteYear = (yearId, event) => {
    event.stopPropagation();
    const updatedYears = years.filter(year => year.id !== yearId);
    setYears(updatedYears);
  };

  return (
    <div className="profile-container">
      <WelcomeMessage /> {/* WelcomeMessage placed above the profile content */}
      <div className="main-content-profile">
        <div className="user-context-profile">
          <div className="profile-header">
            <h2 className="profile-heading">User Context</h2>
            <button 
              className={`save-profile-btn ${isSaving ? 'saving' : ''}`} 
              onClick={saveProfile} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
          <div className="input-group-profile">
            <label className="profile-label">University at Undergraduate Level:</label>
            <input
              type="text"
              className="profile-input"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Enter your education"
            />
          </div>
          <div className="input-group-profile">
            <label className="profile-label">Degree/Field Studied</label>
            <textarea
              className="profile-input profile-textarea subcategories-input"
              value={subCategories}
              onChange={(e) => setSubCategories(e.target.value)}
              placeholder="Enter sub categories"
              rows="2"
            ></textarea>
          </div>

          <div className="grades-section-profile">
            <p className="profile-subheading">Undergraduate Grades</p>
            {years.map(year => (
              <div key={year.id} className="year-container-profile">
                <div className="year-header-profile" onClick={() => toggleYearExpansion(year.id)}>
                  <span className="year-name">{year.name}</span>
                  <div className="year-controls">
                    <button className="delete-year-btn" onClick={(e) => deleteYear(year.id, e)}>
                      <Trash2 size={16} />
                    </button>
                    <span className="expand-icon">
                      {year.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </div>
                </div>
                {year.expanded && (
                  <div className="year-content-profile">
                    {year.subjects.map((subject, index) => (
                      <div key={index} className="subject-input-profile">
                        <input
                          type="text"
                          className="profile-input"
                          value={subject.name}
                          onChange={(e) => updateSubject(year.id, index, 'name', e.target.value)}
                          placeholder="Subject name"
                        />
                        <input
                          type="number"
                          className="profile-input"
                          value={subject.grade}
                          onChange={(e) => updateSubject(year.id, index, 'grade', e.target.value)}
                          placeholder="Grade (Out of 100)"
                        />
                        <button className="delete-subject-btn" onClick={() => deleteSubject(year.id, index)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button className="add-subject-profile" onClick={() => addSubject(year.id)}>+ Add Subject</button>
                  </div>
                )}
              </div>
            ))}
            <button className="add-year-profile" onClick={addYear}>+ Add Year</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;