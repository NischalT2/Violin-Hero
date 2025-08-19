import '../App.css';
import { Link } from 'react-router-dom';

function HomeBody(){
    return(
        <>
            <div style={{ fontFamily: 'Chewy, cursive' }} className="flex flex-col justify-center items-center h-screen">
                <p className="text-5xl font-bold">Welcome to Violin Hero! Ready to play some tunes? </p>
                <Link to="/practice">
                    <button className="hover-fill cursor-pointer font-bold border mt-10 p-5 rounded text-5xl">Play</button>
                </Link>            
            </div>
        </>
    )
}

export default HomeBody;