import React from "react";
import "./Refund.css";

const RefundPolicy = () => {
  return (
    <div className="refund-container">
      <h1>CANCELLATION/REFUND POLICY</h1>

      <div className="refund-box">
        <h2>No Refund Policy</h2>
        <p>
          Any money collected as part of subscriptions or any other activities
          shall not be refunded. Contact us at KL Eats (C424) or call at{" "}
          <strong>7205655157</strong> for any issues regarding refunds.
        </p>
        <p>
          You can also email us at{" "}
          <a href="mailto:admin@kleats.in">admin@kleats.in</a> for any issues
          regarding refunds.
        </p>
      </div>

      <footer>
        <p>© 2025 Kleats. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default RefundPolicy;
