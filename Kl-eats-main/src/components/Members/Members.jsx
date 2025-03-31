import React from 'react';
import './Members.css';

const Members = () => {
  const members = [
    {
      name: "Sripath Roy",
      role: "Mentor",
      image: "/path-to-member1.jpg"
    },
    {
      name: "Jashwanth",
      role: "Full Stack Developer",
      image: "/path-to-member1.jpg"
    },
    {
      name: "Raunit Raj",
      role: "Frontend Developer",
      image: "/path-to-member2.jpg"
    },
    {
      name: "Harsh Raj",
      role: "Project Manager",
      image: "/path-to-member3.jpg"
    },
    {
      name: "B.Suraj Patra",
      role: "Scrum Master",
      image: "/path-to-member4.jpg"
    },
    {
      name: "Saneesh Reddy",
      role: "Social Media Manager",
      image: "/path-to-member5.jpg"
    },
    {
      name: "P.Vamsi Krishna",
      role: "Marketing Manager",
      image: "/path-to-member6.jpg"
    },
    {
      name: "K.Praneeth",
      role: "Backend Developer",
      image: "/path-to-member7.jpg"
    },
  ];

  return (
    <div className="company-overview">
      <div className="members-section" id="members-section">
        <h2>Our Team</h2>
        <p className="members-description">
          Welcome to KL Eats, your one-stop platform for discovering and enjoying the best food on campus at KL University, Vijayawada. To become a member, please visit kleats.in/member or find us at KL GLUG (C424).
        </p>
        <div className="members-container">
          <div className="members-scroll">
            {members.map((member, index) => (
              <div key={index} className="member-card">
                <div className="member-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="company-overview">
        <h2 className="section-header">Our Story</h2>
        <p>
          KL Eats was founded in 2023 with a simple mission: to make campus dining easier and more enjoyable for
          students at KL University, Vijayawada. We're passionate about connecting students with the best food options
          on campus, saving them time and enhancing their university experience.
        </p>
      </section>

      <section className="mission-statement">
        <h2 className="section-header">Our Mission</h2>
        <p>
          "To revolutionize campus dining by providing a seamless, user-friendly platform that connects students with
          diverse, quality food options, enhancing their university experience one meal at a time."
        </p>
      </section>

      <section className="contact-info">
        <h2 className="section-header">Get in Touch</h2>
        <p>Have questions or suggestions? We'd love to hear from you!</p>
        <p>Email: info@kleats.in</p>
        <p>Visit us: KL GLUG (C424), KL University, Vijayawada</p>
      </section>
    </div>
  );
};

export default Members;
