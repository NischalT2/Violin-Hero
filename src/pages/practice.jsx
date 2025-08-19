import Header from '../components/header';
import ScaleOptions from '../components/scaleopt';
import PracticeScreen from '../components/practiceScreen';
import { useState } from 'react';

function Practice() {
    const [pracScreenVisibility, setPracScreenVisibility] = useState(false);
    const [pracScreen, setPracScreen] = useState(null);

    
    return (
        <>
        <Header/>

        {(!pracScreenVisibility) && 
        <ScaleOptions 
        setPracScreenVisibility={setPracScreenVisibility}/>}

        {(pracScreenVisibility) && (<PracticeScreen setPracScreenVisibility={setPracScreenVisibility} />)}
        </>

    )
}

export default Practice;