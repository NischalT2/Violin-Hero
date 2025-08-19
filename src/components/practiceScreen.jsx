import { useState, useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, TickContext } from 'vexflow';
import { PitchDetector } from "pitchy";

function frequencyToNote(frequency) {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);

    if (frequency <= 0) return null;
    const semitonesFromC0 = 12 * Math.log2(frequency / C0);
    const nearestSemitone = Math.round(semitonesFromC0);
    const noteIndex = nearestSemitone % 12;
    const octave = Math.floor(nearestSemitone/12);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = noteNames[noteIndex];

    return `${noteName}/${octave}`;
}


function PracticeScreen({setPracScreenVisibility}) {
    const [started, setStarted] = useState(false);
    const [detectedNote, setDetectedNote] = useState(null);
    const [targetNote, setTargetNote] = useState(null);
    const [feedback, setFeedback] = useState('');

    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const staveRef = useRef(null);
    const contextRef = useRef(null);
    
    const audioContextRef = useRef(null);
    const analyserNodeRef = useRef(null);
    const microphoneStreamRef = useRef(null);
    const animationFrameId = useRef(null);
    const pitchDetectionIntervalId = useRef(null);
    const pitchDetectorRef = useRef(null);

    useEffect(() => {
        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                microphoneStreamRef.current = stream;
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }
                const source = audioContextRef.current.createMediaStreamSource(stream);
                analyserNodeRef.current = audioContextRef.current.createAnalyser();
                analyserNodeRef.current.fftSize = 2048;
                source.connect(analyserNodeRef.current);
                
                pitchDetectorRef.current = PitchDetector.forFloat32Array(analyserNodeRef.current.fftSize);
                const audioData = new Float32Array(analyserNodeRef.current.fftsize);

                const getPitch = () => {
                    analyserNodeRef.current.getFloatTimeDomainData(audioData);
                    const [pitch, clarity] = pitchDetectorRef.current.findPitch(audioData, audioContextRef.current.sampleRate);

                    if (clarity > 0.9 && pitch > 0) {
                        const note = frequencyToNote(pitch);
                        setDetectedNote(note);
                    } else {
                        setDetectedNote(null);
                    }
                };

                pitchDetectionIntervalId.current = setInterval(getPitch, 100);
            } catch (error) {
                console.error('Microphone permission denied or other audio error:', error);
                setFeedback('Microphone access denied. Please allow microphone to use the practice mode.');
            }
        };

        setupAudio();

        return () => {
            if (microphoneStreamRef.current) {
                microphoneStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state != 'closed') {
                audioContextRef.current.close();
            }
            if (pitchDetectionIntervalId.current) {
                clearInterval(pitchDetectionIntervalId.current);
            }
        };
    }, []);
    
    // display for when the user hasn't press started
    useEffect(() => {
        const container = containerRef.current;
        container.innerHTML = '';
        const width = container.clientWidth;

        const renderer = new Renderer(container, Renderer.Backends.SVG);
        renderer.resize(width, 150);
        const context = renderer.getContext();
        context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');

        const stave = new Stave(10, 40, width-20);
        stave.addClef('treble').addTimeSignature('4/4');
        stave.setContext(context);
        stave.draw();

        rendererRef.current = renderer;
        staveRef.current = stave;
        contextRef.current = context;

        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, []);

    // when user press starts
    useEffect(() => {
        if (!started) return;

        const container = containerRef.current;
        const renderer = rendererRef.current;
        const stave = staveRef.current;
        const context = contextRef.current;

        if (!container || !renderer || !stave || !context) return;

        // dummy tickContext for notes, context doesn't matter for custom X
        const tickContext = new TickContext();
        tickContext.addTickable(new StaveNote({ keys: ['c/4'], duration: 'w' }));
        tickContext.preFormat();

        const noteData = [
            { keys: ['a/4'], duration: 'q' },
            { keys: ['b/4'], duration: 'q' },
            { keys: ['c/5'], duration: 'q' },
            { keys: ['g/4'], duration: 'q' },
            { keys: ['e/5'], duration: 'q' },
        ];

        let noteIndex = 0;
        let activeNotes = [];
        const speed = 5;
        const noteSpacing = 200;
        const targetX = stave.getX() + stave.getWidth() / 3;

        let currentTargetNoteInfo = null;

        const checkNoteAccuracy = () => {
            if (currentTargetNoteInfo) {
                const expectedNoteKey = currentTargetNoteInfo.data.keys[0];

                if (detectedNote === expectedNoteKey) {
                    setFeedback('Correct!');
                    currentTargetNoteInfo.played = true;
                } else if (detectedNote != null && detectedNote != expectedNoteKey){
                    const targetNoteName = expectedNoteKey.split('/')[0].toUpperCase();
                    const detectedNoteName = detectedNote.split('/')[0].toUpperCase();
                    if (['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(detectedNoteName)) {
                        setFeedback(`Incorrect! You played ${detectedNoteName} instead of ${targetNoteName}`);
                    } else {
                        setFeedback(`Detected: ${detectedNote}`);
                    }
                }
            } else {
                setFeedback('');
            }
        };


        const drawNotes = () => {
            context.clear();
            stave.draw();

            // highlight the target line
            context.beginPath();
            context.moveTo(targetX, stave.getY());
            context.lineTo(targetX, stave.getY() + stave.getHeight());
            context.StrokeStyle = 'blue';
            context.lineWidth = 2;
            context.stroke();

            // moves the current notes that are in the stave to the right
            activeNotes.forEach((noteObj, index) => {
                noteObj.x += speed;
                
                // note is approaching target line and has not been played
                if (!noteObj.played && noteObj.x >= targetX - 20 && noteObj.x <= targetX + 20) {
                    if (!currentTargetNoteInfo || currentTargetNoteInfo !== noteObj) {
                        setTargetNote(noteObj.data.keys[0]);
                        currentTargetNoteInfo = noteObj;
                        noteObj.startTime = performance.now();
                    }
                }

                // note has passed hte target line and wasn't played
                if (noteObj.x > targetX + 20 && !noteObj.played && currentTargetNoteInfo === noteObj) {
                    setFeedback(`Missed ${noteObj.data.keys[0].toUpperCase()}!`);
                    currentTargetNoteInfo = null;
                    setTargetNote(null);
                }

                const vexNote = new StaveNote(noteObj.data);
                vexNote.setStave(stave);
                vexNote.setContext(context);
                vexNote.setTickContext(tickContext);
                vexNote.setX(noteObj.x - stave.getX());
                vexNote.setXShift(noteObj.x - stave.getX());
                
                if (noteObj.played) {
                    vexNote.setStyle({
                        fillStyle: 'green', strokeStyle: 'green'
                    });
                }
                
                vexNote.draw();
            });

            

            // removes notes that have glided too far to the right
            activeNotes = activeNotes.filter(note => note.x < container.clientWidth - stave.getX() + 20);

            if (noteIndex < noteData.length) {
                const lastNote = activeNotes[activeNotes.length - 1];
                if (activeNotes.length === 0 || lastNote.x >= stave.getX() + noteSpacing) {
                    activeNotes.push({
                        data: noteData[noteIndex],
                        x: stave.getX(),
                        played: false,
                        startTime: null,
                    });
                    noteIndex++;
                }
            } else if (activeNotes.length === 0) {
                setFeedback('Practice finished!');
                setStarted(false);
                return;
            }

            checkNoteAccuracy();

            animationFrameId.current = requestAnimationFrame(drawNotes);

            // const vexNotes = activeNotes.map(noteObj => {
            //     const note = new StaveNote(noteObj.data);
            //     note.setStave(stave);
            //     note.setContext(context);
            //     note.setTickContext(tickContext);
            //     note.setX(noteObj.x - stave.getX());
            //     note.setXShift(noteObj.x - stave.getX());

            //     return note;
            // });
            
            // console.log(vexNotes);
            // vexNotes.forEach(note => note.draw());
        };

        animationFrameId.current = requestAnimationFrame(drawNotes);

        // const addNote = () => {
        //     if (noteIndex < noteData.length) {
        //         const newNoteAbsoluteX = stave.getX();
        //         if (activeNotes.length === 0 || 
        //             (activeNotes[activeNotes.length - 1].x + 20 + noteSpacing >= container.clientWidth) ||
        //             (activeNotes.length > 0 && activeNotes[activeNotes.length - 1].x >= stave.getX() + noteSpacing)) {
        //                 const lastNote = activeNotes[activeNotes.length - 1];
        //                 if (activeNotes.length === 0 || lastNote.x >= (stave.getX() + noteSpacing)) {
        //                     activeNotes.push({
        //                         data: noteData[noteIndex],
        //                         x: stave.getX()
        //                     });
        //                     noteIndex++;
        //                 }
        //         }
        //     } else if (activeNotes.length === 0) {
        //         return true;
        //     }
        //     return false;
            
        // };

        // const animationLoop = () => {
        //     drawNotes();
        //     const finished = addNote();
        //     if (finished) {
        //         clearInterval(animationInterval);
        //     }
        // };

        // const animationInterval = setInterval(animationLoop, 30);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            context.clear();
            stave.draw();
            setTargetNote(null);
            currentTargetNoteInfo = null;
        };
    }, [started, detectedNote]);

    return (
        <>
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <div className="w-full max-w-5xl bg-white shadow-md rounded-md p-4">
                <div ref={containerRef} className="w-full h-[150px] "></div>
                <div className="flex justify-center gap-4 mt-4">
                    <button 
                    className="hover-fill cursor-pointer font-bold border p-3 rounded text-2xl"
                    onClick={() => setStarted(true)}
                    >Start</button>
                    <button 
                    className="hover-fill cursor-pointer font-bold border border-red-500 text-red-500 p-3 rounded text-2xl"
                    style={{'--hover-fill-color': '#dc2626'}}
                    onClick={() => {
                        setStarted(false);
                        setPracScreenVisibility(false)}}
                    >Close</button>
                </div>
                
            </div>
        </div>
        </>
    )
}

export default PracticeScreen;
