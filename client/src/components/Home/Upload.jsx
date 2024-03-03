import React, { useState } from "react";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const url = file.type.startsWith("image")
        ? "http://localhost:8000/predict_image"
        : "http://localhost:8000/predict";
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setPredictions(data);
      setLoading(false);
    } catch (error) {
      setError("An error occurred while making the prediction.");
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
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {predictions && (
        <div>
          <h3>Prediction Result:</h3>
          <p>
            Class: {predictions.prediction}, Confidence:{" "}
            {predictions.Confidence}%
          </p>
        </div>
      )}
      {file && <button onClick={handleUpload}>Predict</button>}
    </div>
  );
};

export default Upload;
