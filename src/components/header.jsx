import { Link } from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.png';

function Header() {
    
    return (
        <>
        <div className="flex justify-center m-5 font-bold"> 
            <div className="flex justify-between w-full items-center px-5 font-bold max-w-7xl">
                <Link to="/">
                    <img src={logo} alt="Violin Hero Logo" className="h-30 w-auto" />
                </Link>
                <div className = "flex gap-x-16 w-auto">
                    <Link to="/practice">
                        <button className="cursor-pointer text-xl hover-underline">Practice</button>
                    </Link>

                    <button className="cursor-pointer text-xl hover-underline">Help</button>
                    <button className="cursor-pointer text-xl hover-underline">Settings</button>
                </div>
            </div>
        </div>
        
        </>
    )
}

export default Header;