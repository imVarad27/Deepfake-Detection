// Info.jsx

import React from "react";
import "./info.css";

const Info = () => {
  return (
    <div className="info-container">
      <div className="info-box">
        <h2>Info about Deepfake</h2>
        <p>
          Deepfake is a synthetic media in which a person in an existing image
          or video is replaced with someone else's likeness.
        </p>
      </div>
      <div className="info-box">
        <h2>Cause</h2>
        <p>
          Deepfakes are made by using deep learning techniques to manipulate
          media content, often for malicious purposes.
        </p>
      </div>
      <div className="info-box">
        <h2>What our website checks</h2>
        <p>
          Our website checks for the authenticity of images and videos to
          identify whether they are deepfakes or not.
        </p>
        <span className="checkmark">&#10004;</span>
      </div>
    </div>
  );
};

export default Info;
