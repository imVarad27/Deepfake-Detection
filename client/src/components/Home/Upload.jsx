import React, { useState } from "react";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [faceDetectionError, setFaceDetectionError] = useState(null); // State for face detection error message

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

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
    setPredictions(null);
    setError(null);
    setFaceDetectionError(null); // Clear face detection error message
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const url = file.type.startsWith("image")
        ? "http://localhost:8000/predict_image"
        : "http://localhost:8000/upload_video/";

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        if (file.type.startsWith("image")) {
          if (data.error) {
            // Check if face detection error message is received
            setFaceDetectionError(data.error); // Set face detection error message
          } else {
            setFaceDetectionError(null); // Clear face detection error message

            setPredictions({
              prediction: data.prediction,
              realProbability: parseFloat(
                data.predicted_probability_real
              ).toFixed(2),
              fakeProbability: parseFloat(
                data.predicted_probability_fake
              ).toFixed(2),
            });
          }
        } else {
          if (data.predictions[0][0] === 0) {
            const test = Math.round(data.predictions[0][1] * 100) / 100;
            console.log(test);
            setPredictions({
              prediction: "Fake",
              fakeProbability: Math.round(data.predictions[0][1] * 100) / 100,
              realProbability:
                100 - Math.round(data.predictions[0][1] * 100) / 100,
            });
          } else {
            setPredictions({
              prediction: "Real",
              realProbability: Math.round(data.predictions[0][1] * 100) / 100,
              fakeProbability:
                100 - Math.round(data.predictions[0][1] * 100) / 100,
            });
          }
        }
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
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
      {loading && <p className="loading-text">Loading...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      {faceDetectionError && ( // Display face detection error message
        <p className="error-text">{faceDetectionError}</p>
      )}
      {predictions && (
        <div>
          <h3 className="prediction-heading">Prediction Result:</h3>
          <p>
            <span className="prediction-label">Class:</span>{" "}
            <span className="prediction-value">{predictions.prediction}</span>
          </p>
          <p>
            <span className="prediction-label">Probability of Real:</span>{" "}
            <span className="prediction-value">
              {predictions.realProbability}
            </span>
          </p>
          <p>
            <span className="prediction-label">Probability of Fake:</span>{" "}
            <span className="prediction-value">
              {predictions.fakeProbability}
            </span>
          </p>
        </div>
      )}
      {file && (
        <button className="predict-button" onClick={handleUpload}>
          Predict
        </button>
      )}
    </div>
  );
};

export default Upload;
