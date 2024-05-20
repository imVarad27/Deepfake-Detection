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
        <ul>
          <li>Authenticity of images</li>
          <li>Authenticity of videos</li>
          <li>Identification of deepfakes</li>
        </ul>
      </div>
    </div>
  );
};

export default Info;
