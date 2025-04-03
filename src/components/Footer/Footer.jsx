import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-container">
        <p>© {new Date().getFullYear()} KL Eats. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="mailto:info@kleats.in">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
