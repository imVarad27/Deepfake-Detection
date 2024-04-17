import React from "react";
import { useState, useCallback } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Home from "./components/Home/Homepage";
import Login from "./components/Login-Register/Login";
import SignUp from "./components/Login-Register/Signup";
import Header from "./components/Header/header";
import About from "./components/About/About";
import ForgotPass from "./components/Login-Register/ForgotPass";

import "./App.css";

const App = () => {
  const user = useSelector((state) => state.user);
  if (user) {
    return (
      <>
        <Header />
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
        <Navigate replace to="/home" />
      </>
    );
  } else {
    return (
      <>
        <div>
          <Header />
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgotPass" element={<ForgotPass />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </>
    );
  }
};

export default App;
