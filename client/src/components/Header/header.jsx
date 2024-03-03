import { NavLink } from "react-router-dom";
import "./header.css";
const Header = () => {
  return (
    <header>
      <h1>DeepFake Detection</h1>
      <nav>
        <ul>
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/about">About</NavLink>
          </li>
          <li>
            <NavLink to="/other">Other</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
