import React, { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import Toast from "react-bootstrap/Toast";

import "./index.css";

const ResetPassword = () => {
  const [redirect, setRedirect] = useState(false);
  const [success, setSuccess] = useState();
  const [error, setError] = useState();
  const [emailValidation, setEmailValidation] = useState();
  const [otpValidation, setOtpValidation] = useState();
  const [passwordValidation, setPasswordValidation] = useState();
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState();
  const [showEmailValidation, setShowEmailValidation] = useState();
  const [showOtpValidation, setShowOtpValidation] = useState();
  const [showPasswordValidation, setShowPasswordValidation] = useState();
  const [showConfirmPasswordValidation, setShowConfirmPasswordValidation] =
    useState();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false); // State to track if OTP has been sent
  const [otpVerified, setOtpVerified] = useState(false); // State to track if OTP has been verified

  const isValidEmail = (email) => {
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    return false;
  };

  // Function to simulate OTP sending
  const sendOtp = () => {
    // Simulate OTP sending logic here
    setOtpSent(true);
  };

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{10,}$/;
    const messages = [];
    if (password === "") {
      return;
    }
    if (password !== undefined && !passwordRegex.test(password)) {
      messages.push("Password must contain:");
      if (password.length < 10) {
        messages.push("- at least 10 characters long");
      }
      if (!/(?=.*\d)/.test(password)) {
        messages.push("- at least one number");
      }
      if (!/(?=.*[a-z])/.test(password)) {
        messages.push("- at least one lowercase letter");
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        messages.push("- at least one uppercase letter");
      }
      if (!/(?=.*[!@#$%^&*])/.test(password)) {
        messages.push("- at least one special character");
      }
    }
    return messages;
  };

  const isInitialRender = useRef(true);
  const isInitialRenderForPassword = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!isValidEmail(email)) {
      setEmailValidation("Email is not valid");
      setShowEmailValidation(true);
    } else {
      setEmailValidation("");
      setShowEmailValidation(false);
    }
  }, [email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError(null);
    }, 1200);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(null);
    }, 1200);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (isInitialRenderForPassword.current) {
      isInitialRenderForPassword.current = false;
      return;
    }
    const validationMessages = validatePassword(password);
    if (validationMessages !== undefined && validationMessages.length === 0) {
      setShowPasswordValidation(false);
    } else {
      setShowPasswordValidation(true);
      setPasswordValidation(validationMessages);
    }
  }, [password]);

  useEffect(() => {
    if (otpVerified) {
      setShowPasswordValidation(false);
      setShowConfirmPasswordValidation(false);
    } else {
      setShowPasswordValidation(true);
      setShowConfirmPasswordValidation(true);
    }
  }, [otpVerified]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "email":
        setEmail(value);
        break;
      case "otp":
        setOtp(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  const ButtonSubmitHandler = async (e) => {
    e.preventDefault();
    let error = false;
    if (password !== confirmPassword) {
      setConfirmPasswordValidation("Passwords don't match");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailValidation("Email is not valid");
      setShowEmailValidation(true);
      error = true;
    }
    const passwordMessages = validatePassword(password);
    if (passwordMessages && passwordMessages.length > 0) {
      setPasswordValidation(passwordMessages);
      setShowPasswordValidation(true);
      error = true;
    }
    if (password === undefined || password === "") {
      setPasswordValidation(["Please Enter Password"]);
      setShowPasswordValidation(true);
      error = true;
    }
    if (error) {
      return;
    }

    try {
      const response = await fetch("http://localhost:8001/resetpassword", {
        method: "POST",
        body: JSON.stringify({
          email: email,
          password: password,
        }),
        headers: { "Content-Type": "application/json" },
      });
      console.log(response);
      if (response.ok) {
        const body = await response.json();
        setSuccess(body.message);

        setTimeout(() => {
          setRedirect(true);
        }, 2000);
      } else {
        const body = await response.json();
        setError(body.detail);
        console.log(body);
      }
    } catch (error) {
      console.log(error);
      setError(error.message);
    }
  };

  return (
    <>
      {error && (
        <Toast className="d-inline-block m-1" bg="danger">
          <Toast.Body className="Danger">{error}</Toast.Body>
        </Toast>
      )}
      {success && (
        <Toast className="d-inline-block m-1" bg="success">
          <Toast.Body className="Success">{success}</Toast.Body>
        </Toast>
      )}
      {redirect && <Navigate to="/login" />}
      {!redirect && (
        <div className="App">
          <div className="auth-wrapper">
            <div className="auth-inner">
              <form>
                <h3>Enter Password!</h3>
                <div className="mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    className={`form-control ${
                      showEmailValidation ? "invalid-input" : ""
                    }`}
                    placeholder="Enter email"
                    name="email"
                    onChange={handleChange}
                    value={email}
                  />
                  {showEmailValidation && (
                    <p className="error-msg">{emailValidation}</p>
                  )}
                </div>
                <div className="mb-3">
                  <label>New Password</label>
                  <input
                    type="password"
                    className={`form-control ${
                      showPasswordValidation ? "invalid-input" : ""
                    }`}
                    placeholder="Enter password"
                    name="password"
                    onChange={handleChange}
                    value={password}
                  />
                  {showPasswordValidation &&
                    passwordValidation &&
                    passwordValidation.map((msg, index) => {
                      return (
                        <p className="error-msg" key={index}>
                          {msg}
                        </p>
                      );
                    })}
                </div>
                <div className="mb-3">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    className={`form-control ${
                      showPasswordValidation ? "invalid-input" : ""
                    }`}
                    placeholder="Enter confirm password"
                    name="confirmPassword"
                    onChange={handleChange}
                    value={confirmPassword}
                  />
                  {confirmPasswordValidation && (
                    <p className="error-msg">{confirmPasswordValidation}</p>
                  )}
                </div>
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={ButtonSubmitHandler}
                  >
                    Submit
                  </button>
                </div>
                <p className="forgot-password text-right">
                  Remember Password <Link to="/login">sign in?</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResetPassword;
