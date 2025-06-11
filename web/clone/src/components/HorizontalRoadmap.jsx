import React from "react";
import "./HorizontalRoadmap.css";

const isCritical = (text) => /dikkat|önemli|kritik|uyarı|risk/i.test(text);

const ARROW_RIGHT = (
  <svg width="32" height="24" viewBox="0 0 32 24" fill="none" style={{margin: "0 8px"}} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12h28m0 0l-7-7m7 7l-7 7" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ARROW_DOWN = (
  <svg width="24" height="32" viewBox="0 0 24 32" fill="none" style={{margin: "0 8px"}} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2v28m0 0l7-7m-7 7l-7-7" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HorizontalRoadmap = ({ steps, itemsPerRow = 3 }) => {
  const rows = [];
  for (let i = 0; i < steps.length; i += itemsPerRow) {
    rows.push(steps.slice(i, i + itemsPerRow));
  }

  return (
    <div className="horizontal-roadmap">
      {rows.map((row, rowIdx) => (
        <div className="roadmap-row" key={rowIdx}>
          {row.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className={`roadmap-step${isCritical(step) ? " critical" : ""}`}>{step}</div>
              {idx !== row.length - 1 && ARROW_RIGHT}
            </React.Fragment>
          ))}
          {rowIdx !== rows.length - 1 && ARROW_DOWN}
        </div>
      ))}
    </div>
  );
};

export default HorizontalRoadmap; 