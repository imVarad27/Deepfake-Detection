// Home.jsx

import React from "react";
import Upload from "./Upload";
import "./Upload.css";
import Header from "../Header/header";
import Footer from "../Footer/footer";
import Info from "../Information/info";

const Home = () => {
  return (
    <div>
      <h1 className="main-heading">Welcome to DeepFake Detection</h1>
      <h3 className="sub-headline">
        Check your image/video real or fake with incredible accuracy.
      </h3>
      <Upload />

      <Info />
      <Footer />
    </div>
  );
};

export default Home;
