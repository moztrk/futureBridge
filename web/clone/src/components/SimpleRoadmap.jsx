import React from "react";
import "./SimpleRoadmap.css";

const isCritical = (text) => /dikkat|önemli|kritik|uyarı|risk/i.test(text);

const SimpleRoadmap = ({ steps }) => (
  <div className="simple-roadmap">
    {steps.map((step, idx) => (
      <div
        key={idx}
        className={`simple-roadmap-step${isCritical(step) ? " critical" : ""}`}
      >
        {step}
      </div>
    ))}
  </div>
);

export default SimpleRoadmap; 