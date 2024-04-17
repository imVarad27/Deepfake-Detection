import React, { useEffect, useRef, useState } from "react";
import "./index.css";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../actions/authActions";
import Spinner from "react-bootstrap/Spinner";
import Toast from "react-bootstrap/Toast";

const Login = () => {
  const dispatch = useDispatch();
  const [emailRef, setEmailRef] = useState();
  const [passwordRef, setPasswordRef] = useState();

  const [isLoading, setIsLoading] = useState(false);

  const [emailValidation, setEmailValidation] = useState();
  const [showEmailValidation, setShowEmailValidation] = useState();

  const [error, setError] = useState();

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
    }
  }, [emailRef]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError(null);
    }, 1200);
    return () => clearTimeout(timer);
  }, [error]);

  const ButtonSubmitHandler = async (e) => {
    e.preventDefault();
    if (emailRef === undefined || emailRef === "") {
      setEmailValidation("Please Enter Email");
      setShowEmailValidation(true);
    }
    if (!isValidEmail(emailRef)) {
      setEmailValidation("Email is not valid");
      setShowEmailValidation(true);
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8001/login", {
        method: "POST",
        body: JSON.stringify({
          email: emailRef,
          password: passwordRef,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const responseData = await response.json(); // Parse response data as JSON
        dispatch(login(responseData.user));
        setIsLoading(false);
      } else {
        const body = await response.json();
        setError(body.detail);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Toast className="d-inline-block m-1" bg="danger">
          <Toast.Body className="Danger">{error}</Toast.Body>
        </Toast>
      )}
      {isLoading && (
        <div className="spinner-container">
          <Spinner animation="grow" />
        </div>
      )}
      {/* Render the spinner if isLoading is true */}
      {!isLoading && ( // Render the form only if isLoading is false
        <div className="App">
          <div className="auth-wrapper">
            <div className="auth-inner">
              <form>
                <h3>Sign In</h3>
                <div className="mb-3">
                  <label>Email address</label>
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
                <div className="mb-3">
                  <label>Password</label>
                  <input
                    type="password"
                    className={`form-control`}
                    placeholder="Enter password"
                    onChange={(e) => {
                      setPasswordRef(e.target.value);
                    }}
                  />
                </div>
                <div className="e-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={ButtonSubmitHandler}
                  >
                    Submit
                  </button>

                  <button className="btn btn-primary">
                    <Link to="/signup" className="g-grid">
                      Signup
                    </Link>
                  </button>

                  <button className="btn btn-link">
                    <Link to="/forgotPass" className="btn btn-link">
                      Forgot Password
                    </Link>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}{" "}
    </>
  );
};

export default Login;
