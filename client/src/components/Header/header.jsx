import { NavLink } from "react-router-dom";
import "./header.css";
const Header = () => {
  return (
    <header>
      <h1>DeepFake Detection</h1>
      <nav>
        <ul>
          <li>
            <NavLink exact to="/" activeClassName="active">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" activeClassName="active">
              About
            </NavLink>
          </li>
          <li>
            <NavLink to="/other" activeClassName="active">
              Other
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
