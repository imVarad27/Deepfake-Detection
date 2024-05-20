import React, { useEffect, useRef, useState } from "react";
import "./index.css"; // Import CSS file
import { useNavigate } from "react-router-dom";

const OtpValidationForm = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false); // Track if OTP is sent
  const [emailRef, setEmailRef] = useState();
  const [emailValidation, setEmailValidation] = useState();
  const [showEmailValidation, setShowEmailValidation] = useState();
  const navigation = useNavigate();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!isValidEmail(emailRef)) {
      setEmailValidation("Email is not valid");
      setShowEmailValidation(true);
    } else {
      setEmailValidation("");
      setShowEmailValidation(false);
      return;
    }
  }, [emailRef]);

  const handleGetOtp = async (e) => {
    e.preventDefault();
    if (emailRef === undefined || emailRef === "") {
      setEmailValidation("Please Enter Email");
      setShowEmailValidation(true);
      return;
    }
    if (!isValidEmail(emailRef)) {
      setEmailValidation("Email is not valid");
      setShowEmailValidation(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:8001/generate-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailRef }),
      });
      const data = await response.json();
      setMessage(data.detail);
      if (response.ok) setIsOtpSent(true); // Set OTP sent flag to true
    } catch (error) {
      setMessage(error.response.data.message);
    }
  };

  const isValidEmail = (email) => {
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    return false;
  };

  const handleValidation = async () => {
    try {
      const response = await fetch("http://localhost:8001/validate-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailRef, otp }),
      });
      if (response.ok) {
        navigation("/resetpassword"); // Navigate to ForgotPass page
      }
    } catch (error) {
      setMessage(error.response.data.detail);
    }
  };

  return (
    <div className="App">
      <div className="auth-wrapper">
        <div className="auth-inner">
          <form>
            <h3>OTP Validation</h3>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className={`form-control ${
                  showEmailValidation ? "invalid-input" : ""
                }`}
                placeholder="Enter email"
                onChange={(e) => {
                  setEmailRef(e.target.value);
                }}
              />
              {showEmailValidation && emailValidation && (
                <p className="error-msg">{emailValidation}</p>
              )}
            </div>

            {!isOtpSent && (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleGetOtp}
              >
                Get OTP
              </button>
            )}

            {isOtpSent && (
              <div className="form-group">
                <label>OTP</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            )}

            {isOtpSent && (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleValidation}
              >
                Validate OTP
              </button>
            )}

            {message && <div className="error-msg">{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpValidationForm;
