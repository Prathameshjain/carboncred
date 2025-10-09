import { useNavigate } from "react-router-dom";
import './navbar.css';

function Navbar() {
    const navigate = useNavigate();
    return (
        <nav className="navbar fixed-top">
            <div className="navbar-container pr-24 pl-24">
                <div className="font-bold text-green-700 font-balsamiq text-4xl">CarbonCred</div>
                <div className="navbar-menu">
                    <ul className="list-unstyled d-flex gap-2 list-container">
                        <li><button className="d-flex navbar-items">Home</button></li>
                        <li><button className="d-flex navbar-items">About</button></li>
                        <li><button className="d-flex navbar-items">Contact</button></li>
                        <li><button 
                        onClick={() => navigate("/login")}
                        className="d-flex login-btn navbar-items min-w-32 text-white border-none font-bold justify-center items-center" >Login</button></li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
export default Navbar;