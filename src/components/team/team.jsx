import React from 'react';
import './team.css';
import { FaLinkedin, FaInstagram, FaGithub, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Footer from '../Footer/Footer';

const Team = () => {
  const navigate = useNavigate();
  
  const teamMembers = [
    {
      id: 1,
      name: "Sripath Roy",
      role: "Mentor",
      image: "/team/mentor.jpg",
      linkedin: "https://linkedin.com/in/sripath-roy",
      instagram: "https://instagram.com/sripath",
      github: "https://github.com/sripath"
    },
    {
      id: 2,
      name: "Person 1",
      role: "Team Member",
      image: "/team/person1.jpg",
      linkedin: "https://linkedin.com/in/person1",
      instagram: "https://instagram.com/person1",
      github: "https://github.com/person1"
    },
    {
      id: 3,
      name: "Person 2",
      role: "Team Member",
      image: "/team/person2.jpg",
      linkedin: "https://linkedin.com/in/person2",
      instagram: "https://instagram.com/person2",
      github: "https://github.com/person2"
    },
    {
      id: 4,
      name: "Person 3",
      role: "Team Member",
      image: "/team/person3.jpg",
      linkedin: "https://linkedin.com/in/person3",
      instagram: "https://instagram.com/person3",
      github: "https://github.com/person3"
    },
    {
      id: 5,
      name: "Person 4",
      role: "Team Member",
      image: "/team/person4.jpg",
      linkedin: "https://linkedin.com/in/person4",
      instagram: "https://instagram.com/person4",
      github: "https://github.com/person4"
    },
    {
      id: 6,
      name: "Person 5",
      role: "Team Member",
      image: "/team/person5.jpg",
      linkedin: "https://linkedin.com/in/person5",
      instagram: "https://instagram.com/person5",
      github: "https://github.com/person5"
    },
    {
      id: 7,
      name: "Person 6",
      role: "Team Member",
      image: "/team/person6.jpg",
      linkedin: "https://linkedin.com/in/person6",
      instagram: "https://instagram.com/person6",
      github: "https://github.com/person6"
    },
    {
      id: 8,
      name: "Person 7",
      role: "Team Member",
      image: "/team/person7.jpg",
      linkedin: "https://linkedin.com/in/person7",
      instagram: "https://instagram.com/person7",
      github: "https://github.com/person7"
    },
    {
      id: 9,
      name: "Person 8",
      role: "Team Member",
      image: "/team/person8.jpg",
      linkedin: "https://linkedin.com/in/person8",
      instagram: "https://instagram.com/person8",
      github: "https://github.com/person8"
    },
    {
      id: 10,
      name: "Person 9",
      role: "Team Member",
      image: "/team/person9.jpg",
      linkedin: "https://linkedin.com/in/person9",
      instagram: "https://instagram.com/person9",
      github: "https://github.com/person9"
    },
    {
      id: 11,
      name: "Person 10",
      role: "Team Member",
      image: "/team/person10.jpg",
      linkedin: "https://linkedin.com/in/person10",
      instagram: "https://instagram.com/person10",
      github: "https://github.com/person10"
    }
  ];

  return (
    <>
      <div className="team-page">
        <div className="team-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
        </div>

        <div className="team-container">
          <h1 className="team-title">Our Team</h1>
          
          {/* Mentor Card */}
          <div className="mentor-wrapper">
            {teamMembers.slice(0, 1).map((member) => (
              <div key={member.id} className="mentor-card">
                <div className="member-image-wrapper">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="member-info">
                  <h2>{member.name}</h2>
                  <p className="role">{member.role}</p>
                  <div className="social-links">
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                      <FaLinkedin />
                    </a>
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                      <FaInstagram />
                    </a>
                    <a href={member.github} target="_blank" rel="noopener noreferrer">
                      <FaGithub />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Team Members */}
          <h2 className="section-title">Team Members</h2>
          <div className="team-grid">
            {teamMembers.slice(1).map((member) => (
              <div key={member.id} className="team-card">
                <div className="member-image-wrapper">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p className="role">{member.role}</p>
                  <div className="social-links">
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                      <FaLinkedin />
                    </a>
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                      <FaInstagram />
                    </a>
                    <a href={member.github} target="_blank" rel="noopener noreferrer">
                      <FaGithub />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Team;
