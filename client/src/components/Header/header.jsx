import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "./header.css";
import { logout } from "../../actions/authActions";
const Header = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const logoutButtonHandler = () => {
    dispatch(logout());
  };
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
          {user && (
            <li>
              <button onClick={logoutButtonHandler} className="logout-button">
                Logout
              </button>
            </li>
          )}
          {!user && (
            <li>
              <NavLink to="/other">Other</NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
