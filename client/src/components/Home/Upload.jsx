// Upload.jsx

import React, { useState } from "react";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

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

  return (
    <div className="upload-container">
      <h2>Upload Image or Video</h2>
      <form>
        <input type="file" onChange={handleChange} />
      </form>
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
    </div>
  );
};

export default Upload;
