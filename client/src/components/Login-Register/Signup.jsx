import React, { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import Toast from "react-bootstrap/Toast";

import "./index.css";

const SignUp = () => {
  const [redirect, setRedirect] = useState(false);
  const [success, setSuccess] = useState();
  const [error, setError] = useState();
  const [emailValidation, setEmailValidation] = useState();
  const [passwordValidation, setPasswordValidation] = useState();
  const [firstNameValidation, setFirstNameValidation] = useState();
  const [lastNameValidation, setLastNameValidation] = useState();
  const [mobileValidation, setMobileValidation] = useState();
  const [showEmailValidation, setShowEmailValidation] = useState();
  const [showPasswordValidation, setShowPasswordValidation] = useState();
  const [showFirstNameValidation, setShowFirstNameValidation] = useState();
  const [showLastNameValidation, setShowLastNameValidation] = useState();
  const [showMobileValidation, setShowMobileValidation] = useState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [mobile, setMobile] = useState("");

  const isValidEmail = (email) => {
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    return false;
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

  const isValidMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const isValidName = (name) => {
    const nameRegex = /\d/;
    return !nameRegex.test(name);
  };

  const isInitialRender = useRef(true);
  const isInitialRenderForPassword = useRef(true);

  useEffect(() => {
    if (first_name !== "") {
      setShowFirstNameValidation(false);
    }
  }, [first_name]);

  useEffect(() => {
    if (last_name !== "") {
      setShowLastNameValidation(false);
    }
  }, [last_name]);

  useEffect(() => {
    if (mobile !== "") {
      setShowMobileValidation(false);
    }
  }, [mobile]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "first_name":
        setFirstName(value);
        break;
      case "last_name":
        setLastName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "mobile":
        setMobile(value);
        break;
      default:
        break;
    }
  };

  const ButtonSubmitHandler = async (e) => {
    e.preventDefault();
    let error = false;

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
    if (first_name === undefined || first_name === "") {
      setFirstNameValidation("Please enter First name");
      setShowFirstNameValidation(true);
      error = true;
    }
    if (last_name === undefined || last_name === "") {
      setLastNameValidation("Please enter Last name");
      setShowLastNameValidation(true);
      error = true;
    }
    if (mobile === undefined || mobile === "") {
      setMobileValidation("Please enter Mobile number");
      setShowMobileValidation(true);
      error = true;
    }
    if (first_name && !isValidName(first_name)) {
      setFirstNameValidation("Invalid name");
      setShowFirstNameValidation(true);
      error = true;
    }
    if (last_name && !isValidName(last_name)) {
      setLastNameValidation("Invalid name");
      setShowLastNameValidation(true);
      error = true;
    }
    if (mobile && !isValidMobile(mobile)) {
      setMobileValidation("Invalid Mobile number");
      setShowMobileValidation(true);
      error = true;
    }
    if (email === undefined || email === "") {
      setEmailValidation("Please Enter Email");
      setShowEmailValidation(true);
      error = true;
    }
    if (password === undefined || password === "") {
      setPasswordValidation(new Array("Please Enter Password"));
      setShowPasswordValidation(true);
      error = true;
    }
    if (error) {
      return;
    }

    try {
      const response = await fetch("http://localhost:8001/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: first_name,
          last_name: last_name,
          email: email,
          password: password,
          mobile: mobile,
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
                <h3>Sign Up</h3>
                <div className="mb-3">
                  <label>First name</label>
                  <input
                    type="text"
                    required
                    className={`form-control ${
                      showFirstNameValidation ? "invalid-input" : ""
                    }`}
                    placeholder="First name"
                    name="first_name"
                    value={first_name}
                    onChange={handleChange}
                  />
                  {showFirstNameValidation && firstNameValidation && (
                    <p className="error-msg">{firstNameValidation}</p>
                  )}
                </div>
                <div className="mb-3">
                  <label>Last name</label>
                  <input
                    type="text"
                    className={`form-control ${
                      showLastNameValidation ? "invalid-input" : ""
                    }`}
                    placeholder="Last name"
                    name="last_name"
                    value={last_name}
                    onChange={handleChange}
                  />
                  {showLastNameValidation && lastNameValidation && (
                    <p className="error-msg">{lastNameValidation}</p>
                  )}
                </div>
                <div className="mb-3">
                  <label>Mobile</label>
                  <input
                    type="number"
                    className={`form-control ${
                      showMobileValidation ? "invalid-input" : ""
                    }`}
                    placeholder="Mobile"
                    name="mobile"
                    value={mobile}
                    onChange={handleChange}
                  />
                  {showMobileValidation && mobileValidation && (
                    <p className="error-msg">{mobileValidation}</p>
                  )}
                </div>
                <div className="mb-3">
                  <label>Email address</label>
                  <input
                    type="email"
                    className={`form-control ${
                      showEmailValidation ? "invalid-input" : ""
                    }`}
                    placeholder="Enter email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                  />
                  {showEmailValidation && emailValidation && (
                    <p className="error-msg">{emailValidation}</p>
                  )}
                </div>
                <div className="mb-3">
                  <label>Password</label>
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
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={ButtonSubmitHandler}
                  >
                    Sign Up
                  </button>
                </div>
                <p className="forgot-password text-right">
                  Already registered <Link to="/login">sign in?</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignUp;
