

function ScaleOptions({setPracScreenVisibility}){
    const scales = ['A major', 'D Major', 'G Major', 'C Major', 'E Minor', 'fj', 'fj', 'fj', 'fj', 'fj', 'fj']
    const strings = ['G', 'D', 'A', 'E'];
    
    return(
        <>
            <p className="mt-30 font-bold text-3xl">Practice a scale </p>
            <div className="grid grid-cols-5 gap-5 w-full mt-5"> 
                {scales.map(scale => (
                    <button key={scale} onClick={() => setPracScreenVisibility(true)} className="hover-fill cursor-pointer text-xl p-10 border rounded font-bold">
                        {scale}
                    </button>
                ))}
            </div>

            <p className="mt-15 font-bold text-3xl"> Master a String </p>
            <div className="grid grid-cols-4 gap-5 w-full mt-5"> 
                {strings.map(string => (
                    <button key={string} onClick={() => setPracScreenVisibility(true)} className="hover-fill cursor-pointer text-xl p-10 border rounded font-bold">
                        {string}
                    </button>
                ))}
            </div>
        </>
    )
}

export default ScaleOptions;