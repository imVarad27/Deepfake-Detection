import React, { Component } from "react";
import "./index.css";

export default class Login extends Component {
  render() {
    return (
      <form>
        <h3>Sign In</h3>
        <div className="mb-3">
          <label>Email address</label>
          <input
            type="email"
            className="form-control"
            placeholder="Enter email"
          />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter password"
          />
        </div>
        <div className="mb-3">
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              id="customCheck1"
            />
            <label className="custom-control-label" htmlFor="customCheck1">
              Remember me
            </label>
          </div>
        </div>
        <div className="e-grid">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>

          <button type="submit" className="btn btn-primary">
            <a href="/sign-up" className="g-grid">
              Signup
            </a>
          </button>
        </div>

        {/* <p className="forgot-password text-right">
          Forgot <a href="#">password?</a>
        </p> */}
      </form>
    );
  }
}
