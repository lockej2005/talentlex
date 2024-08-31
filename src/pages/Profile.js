import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const [education, setEducation] = useState('');
  const [subCategories, setSubCategories] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [years, setYears] = useState([
    { id: 1, name: 'Year 1', expanded: false, subjects: [] },
    { id: 2, name: 'Year 2', expanded: true, subjects: [
      { name: 'Law of Obligations', grade: 60 },
      { name: 'Introduction to Legal System', grade: 63 }
    ] }
  ]);

  const addYear = () => {
    const newYear = {
      id: years.length + 1,
      name: `Year ${years.length + 1}`,
      expanded: false,
      subjects: []
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
    event.stopPropagation(); // Prevent triggering toggleYearExpansion
    const updatedYears = years.filter(year => year.id !== yearId);
    setYears(updatedYears);
  };

  const handleScrapeLinkedIn = () => {
    // Implement LinkedIn scraping logic here
    console.log('Scraping LinkedIn profile:', linkedInUrl);
  };

  return (
    <div className="profile-container">
      <div className="main-content-profile">
        <div className="user-context-profile">
          <h2 className="profile-heading">User Context</h2>
          <div className="input-group-profile">
            <label className="profile-label">Education:</label>
            <input
              type="text"
              className="profile-input"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Enter your education"
            />
          </div>
          <div className="input-group-profile">
            <label className="profile-label">Sub Categories: Undergraduate, Masters or Both</label>
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
          <div className="input-group-profile">
            <label className="profile-label">Work Experience:</label>
            <textarea
              className="profile-textarea"
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              placeholder="Enter your work experience"
            ></textarea>
          </div>
        </div>
      </div>
      <div className="linkedin-scraper-profile">
        <h3 className="profile-subheading">LinkedIn Scraper</h3>
        <input
          type="text"
          className="profile-input2"
          value={linkedInUrl}
          onChange={(e) => setLinkedInUrl(e.target.value)}
          placeholder="Enter LinkedIn URL"
        />
        <button className="scrape-button-profile" onClick={handleScrapeLinkedIn}>Scrape LinkedIn</button>
      </div>
    </div>
  );
};

export default Profile;