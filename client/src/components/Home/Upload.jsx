import React, { useState } from "react";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    console.log(selectedFile);

    // Generate preview URL for images or videos
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDeselect = () => {
    setFile(null);
    setPreview(null);
    setPrediction(null);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    console.log(formData);
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log(data);
      setPrediction(data.predictions); // Update state with predictions
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="upload-container">
      {file && (
        <button className="close-button" onClick={handleDeselect}>
          X
        </button>
      )}
      <h2>Upload Image or Video</h2>
      <form>
        <label htmlFor="file-upload" className="upload-button">
          Choose File
        </label>
        <input
          type="file"
          id="file-upload"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </form>
      {file && <p>Selected File: {file.name}</p>}
      {preview && (
        <div className="preview-container">
          {file.type.startsWith("image") ? (
            <img src={preview} alt="Uploaded" className="preview" />
          ) : (
            <video controls className="preview">
              <source src={preview} type={file.type} />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
      {prediction && (
        <div>
          <h3>Prediction Result:</h3>
          <ul>
            {prediction.map((pred, index) => (
              <li
                key={index}
              >{`Class: ${pred[0]}, Confidence: ${pred[1]}%`}</li>
            ))}
          </ul>
        </div>
      )}
      {file && <button onClick={handleUpload}>Predict</button>}
    </div>
  );
};

export default Upload;
