// not included in node / jest

velato.frequencylist = [];

var velato_audio_interface = function () {

    /*
     * Velato Audio Interface is responsible for:
     *
     * Handles audio stream from the user
     * Detects a new pitch and passes to velato.programbuilder
     * Reports back errors from programbuilder -- FXIME: this should be moved
     *
     * FIXME: It writes directly to some divs (e.g. currNote) and does some unrelated
     * user interface stuff. That should be moved to velato.web_display
     * 
     */

    let SAMPLE_MS = 200; // number of milliseconds before re-sampling
    let SPACE_BETWEEN_NOTES = 1; // This times SAMPLE_MS sets how much time we need before a note is considered the next one
    let MIN_LENGTH_OF_NOTE = 2; // This times SAMPLE_MS is how long a note must be sounded before it is considered intentional

    let LOW_OCTAVE = 5; // lowest octave we will accept
    let HIGH_OCTAVE = 6; // highest octave we will accept

    const BUILTINS = 
        "const output = document.getElementById('output');\n" +
        "function print(content) { output.innerText += content; } \n\n";


    var is_stopped = false; // whether we are currently in a stopped state

    let input = null; // the listener

    var audioContext = new AudioContext();


    console.log("Audio is starting up ...");

    if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia){

        navigator.getUserMedia({audio:true}, 
            function(stream) {
                start_microphone(stream);
            },
            function(e) {
            alert('Error capturing audio.');
            }
        );

    } else { alert('getUserMedia not supported in this browser.'); }

    function parse_notes(noteset) {
        for (let i = 0; i < noteset.length; i++) {
        if (i > 0)
            noteset[i].low = ((noteset[i].freq + noteset[i-1].freq) / 2.0);
        else
            noteset[i].low = noteset[i].freq;
        }
        return noteset;
    }

    function load_notes(pitch) {
        console.log("Loading json files for freqs and keys");

        // load list of notes
        var req = new XMLHttpRequest();
        req.overrideMimeType("application/json");
        req.open('GET', "../data/frequencies.json", true);
        req.onload  = function() {
            var noteset = parse_notes(JSON.parse(req.responseText));
            velato.frequencylist = noteset;

            input = setInterval(function() {
                process_pitch(pitch, noteset);
            }, SAMPLE_MS);

        };
        req.send(null);
    }

    var pitch_detect = null;

    // possibly unnecessary modal...
    function close_loading_modal() {
        loading_modal = document.getElementById("loading_modal");
        loading_modal.style.display = "none";
    }

    function start_microphone(stream){

        pitch_detect = ml5.pitchDetection(
        "../lib/crepe", // path from where it's loaded (web folder)
        audioContext,
        stream,
        streamStarted
        );

        function streamStarted() {
            console.log("Listening to audio stream");
        }

        load_notes(pitch_detect)
        close_loading_modal();
    }

    function stopevent() {
        stop(false);
    }

    function stop(ended) {
        // ended = program has ended (instead of just paused)

        stopbtn = document.getElementById("stop");

        if (ended) {
            stopbtn.classList.add("disabled");
            stopbtn.onclick = null;
        } else {
            stopbtn.innerText = "CONTINUE";
        }
        clearInterval(input);
        audioContext.suspend();
        is_stopped = true;
        stopbtn.onclick = resume;
    }

    function resume() {
        stopbtn = document.getElementById("stop");

        load_notes(pitch_detect);
        audioContext.resume();
        stopbtn.innerText = "PAUSE";
        stopbtn.onclick = stopevent;
    }

    function reset_program() {
        if (is_stopped) {
            load_notes(pitch_detect);
            stopbtn.classList.remove("disabled");
            stopbtn.onclick = stopevent;
        }
        velato.programbuilder.reset_program();
        
        document.getElementById("velato_program").innerHTML = "";
        document.getElementById("curr_cmd_notes").innerHTML = "";
        document.getElementById("feedback").innerHTML = "";
        document.getElementById("output").innerHTML = "";
        document.getElementById("program_txt").innerHTML = "";

        reset_root();


        if (is_stopped) {
            resume();
        }
    }

    // These are for the INTRO modal 
    function close_modal(e) {
       var modal = document.getElementById("modal");
       var modal_content = document.getElementById("modal");
       modal.style.display = "none";
       modal_content.style.display = "none";
    }

    function block_close_modal(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }

    window.addEventListener("load", function() {
        // FIXME: why is this in the audio interface?

        document.getElementById("stop").onclick = stopevent;
        document.getElementById("restart").onclick = reset_program;
        document.getElementById("remove").onclick = velato.programbuilder.remove_last_line;

        document.getElementById("modal").onclick = close_modal;
        document.getElementById("modal_content").onclick = block_close_modal;
        document.getElementById("close").onclick = close_modal;
    });


    function write(text, bolded = false) {
        const incidentals = document.getElementById("incidentals");
        if (bolded) {
            incidentals.innerHTML = "<span class='inrange'>" + text + "</span><br/>" + incidentals.innerHTML;
            // console.log(text);
        } else {
            incidentals.innerHTML = text + "<br/>" + incidentals.innerHTML;
        }
    }

    // program building

    let currNote = null;
    let numNulls = 0;

    function process_pitch(pitch, noteset) {
        // Process the pitch of the moment -- at this point, may be fluctuating or passing
        pitch.getPitch(function(err, frequency) {
            // console.log(frequency);
            if (frequency == null) {
                write("silence");
                numNulls++;
                check_for_end_of_note();
                return;
            }
            var note = {};
            for(let i = 1; i < noteset.length; i++) {
                if (frequency < noteset[i].low) {
                    note = new velato.note(
                        noteset[i-1].name,
                        noteset[i-1].octave,
                        noteset[i-1].freq,
                        i-1,
                        frequency
                    );
                    break;
                }
            }
            if (note == null) {
                write("silence");
                numNulls++;
                check_for_end_of_note();
                return;
            }
            if (note.octave >= LOW_OCTAVE && note.octave <= HIGH_OCTAVE) {
                write(`<span style="color: var(--focus-emphasis)">NOTE: ${note.name} ${note.octave}</span>`, true);
                process_note(note, noteset);
            }
            else numNulls++; // an out-of-range sound is a null
            check_for_end_of_note();
        });
    }

    function check_for_end_of_note() {
        if (numNulls > SPACE_BETWEEN_NOTES && currNote) {
            // if we held the current note long enough, record it
            if (currNote.notes > MIN_LENGTH_OF_NOTE) {

                curr_cmd_notes = document.getElementById("curr_cmd_notes");
                currnote_name = currNote.displayname;

                var err = document.getElementById("feedback");

                // register it in the program
                try {
                    let is_complete = velato.programbuilder.add_tone(currNote);
                    err.innerText = "";
                    if (is_complete === true) {
                        complete_program();
                    }
                } catch (e) {
                    err.innerHTML= `<span class="err">${e}</span>`;
                }
            }
            numNulls = 0;
            currNote = null;
            currNoteOut = document.getElementById("currNote");
            currNoteOut.innerHTML = "";
        }
    }
   
    function process_note(note, noteset) {
        // A note enters here when it is in range of whistlers

        if (currNote !== null && numNulls < SPACE_BETWEEN_NOTES + 1) {
            // in the same note
            currNote.totFreq += note.actual_frequency;
            currNote.notes++;

            for(let i = 1; i < noteset.length; i++) {
                if (noteset[i].low > (currNote.totFreq / currNote.notes)) {
                    currNote.name = noteset[i-1].name;
                    currNote.octave = noteset[i-1].octave;
                    currNote.actual_frequency = (currNote.totFreq / currNote.notes);
                    currNote.index = i-1;
                    break;
                }
            }            
        } else {
            // reset to the new note
            currNote = note;
            currNote.totFreq = note.actual_frequency;
            currNote.notes = 1;
            numNulls = 0;
        }
        currNoteOut = document.getElementById("currNote");

        // Get correct name for the note
        note_name = currNote.name;

        currNoteOut.innerHTML = note_name;

        if (velato.programbuilder.root_note != null) {
            root_idx = velato.programbuilder.root_note.index;
            while (root_idx > currNote.index)
                root_idx -= 12;
            interval = (currNote.index - root_idx) % 12;
            interval_name = velato.c.INTERVALS[interval];
            currNoteOut.innerHTML += ` (${interval_name})`
        }
    }

    function complete_program() {
        stop(true);

        document.getElementById("output").innerHTML = "";

        let program = document.getElementById("program_txt");
        eval(BUILTINS + program.innerText + "\nprint('\\nDONE');");
    }

}(velato); 