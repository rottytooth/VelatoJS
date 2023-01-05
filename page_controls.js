// page niceties outside of writing Velato programs

var synth;
window.addEventListener('load', load_synth);

key = "C";
noteset = "";

var note_translations = {
    "root" : [0],
    "2nd" : [1,2],
    "3rd" : [3,4],
    "4th" : [5],
    "5th" : [6,7],
    "6th" : [8,9],
    "7th" : [10,11]
}

function load_synth() {
    synth = new Tone.Synth().toDestination();
}

function poll_for_update_root() {
    if (velato.programbuilder.root_note != undefined) {
        curr_note = velato.programbuilder.root_note.name;
        if (key != curr_note ) {
            console.log("set root note to " + curr_note);
            key = curr_note;

            // update notes in instruction box
            notes_to_list = document.getElementsByClassName('instructions')[0].querySelectorAll('.note');
            for (let i = 0; i < notes_to_list.length; i++) {
                rootnote_idx = velato.notelist.findIndex(v => v.name == key && v.octave == 4);
                note = notes_to_list[i].innerText.trim();
                interval_set = rootnote_idx + note_translations[note.substring(1,note.length-1)];

                note_set = note_translations[note.substring(1,note.length-1)];
                
                for (let j = 0; j < note_set.length;j++) {
                    note += " ";
                    if (j > 0) note += "or ";
                    note += velato.notelist[rootnote_idx + note_set[j]].name;
                }
                notes_to_list[i].innerText = note;
            }
        }   
    }
}

a = setInterval(poll_for_update_root, 250);  
// FIXME: this should be event-based, not polling

function play_toneset(notes, rootnote_idx, major, now, time_offset) {
    has_two = false;

    let i = 0;
    // play rest of sequence
    for (i = 0; i < notes.length; i++) {
        intervals = note_translations[notes[i]];
        if (intervals.length > 1) 
            has_two = true;
        interval_set = note_translations[notes[i]];
        interval = (major > 0 && interval_set.length > 1 ? interval_set[major] : interval_set[0]);
        synth.triggerAttackRelease(velato.notelist[rootnote_idx + interval].freq, "8n", now+0.5*(i+time_offset));
    }
    if (has_two) 
        return i;
    else
        return 0;
}

// tone generation
function tone(note_seq) {

    const now = Tone.now();

    octave = 4;
    if (key > 'D' || key < 'C') {
        octave = 3;
    }

    rootnote_idx = velato.notelist.findIndex(v => v.name == key && v.octave == octave);
    notes = note_seq.split(" ");

    offset = play_toneset(notes, rootnote_idx, 0, now, 0);

    if (offset > 0) {
        play_toneset(notes, rootnote_idx, 1, now, offset+1);
    }
}
