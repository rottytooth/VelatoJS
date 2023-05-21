// user interface for the page, such as playing notes and writing the lexicon
// some of what's here should probably be combined into velato_interface
// all stand-alone functions outside of velato namespace, belonging to the page

var synth;

window.addEventListener("load", function() {
    synth = new Tone.Synth().toDestination();
});

key = "C"; // default starting key for example tone generation
noteset = "";

rootNotSet = true;

var note_translations = {
    "root" : [0],
    "2nd" : [1,2],
    "3rd" : [3,4],
    "4th" : [5],
    "5th" : [6,7],
    "6th" : [8,9],
    "7th" : [10,11]
}

function crawl_list(cmds, cmdlistdiv, tone_pattern) {

    for (const key in cmds) {
        if (cmds[key].hasOwnProperty('desc') || cmds[key].hasOwnProperty('name')) {
            let cmd_block_li = document.createElement('li');
            let lcl_tone_pattern = tone_pattern + " " + key;

            // if it is not a token
            if (cmds[key].type == 'category') {
                // <span class="ul_head">Blocks (root)</span>

                cmd_block_li.innerHTML = `<span class="ul_head">${cmds[key].desc}</span>`;

                cmdlistdiv.appendChild(cmd_block_li);
            } else if (cmds[key].type == 'token') {
 
                let play_btn = document.createElement('span');

                let name = cmds[key].name;
                if (cmds[key].desc)
                    name = cmds[key].desc;

                play_btn.innerHTML = `<b>&#x23F5;</b> ${name}`;
                play_btn.setAttribute("onclick", "tone('" + lcl_tone_pattern.trim() + "')");

                play_btn.classList.add("playbutton");
                cmd_block_li.appendChild(play_btn);

                if (cmds[key].note) {
                    cmd_block_li.innerHTML += " " + cmds[key].note;
                }                    

                // all the steps to achieve this command / expression
                let notelist = document.createElement('ul');
                cmd_block_li.appendChild(notelist);

                // first, the tones to complete it
                const tonelist = lcl_tone_pattern.trim().split(" ");
                for (const j in tonelist) {
                    notelist.innerHTML += `<li class="note"><span class="int">{${tonelist[j]}}</span><span class="pitch"></span></li>`;
                }

                // then all the child commands or expressions
                if (cmds[key]['children']) {
                    for (let i = 0; i < cmds[key]['children'].length; i++) {
                        notelist.innerHTML += `<li>${cmds[key]['children'][i].desc}</li>`
                    }
                }
                cmdlistdiv.appendChild(cmd_block_li);
            }
        }
        // call craw_list on children of this node
        if (cmds.hasOwnProperty(key) && typeof(cmds[key]) != "string")
            crawl_list(cmds[key], cmdlistdiv, (tone_pattern + " " + key).trim());

    }
}

// called from velato.programbuilder when tones are ready
function draw_tones(cmd_list) {
    // not a div but emphasizes it is display-side
    var cmdlistdiv = document.getElementById("cmdlist");
    var cmds = cmd_list.Cmd;
    crawl_list(cmds, cmdlistdiv, "");

    var explistdiv = document.getElementById("explist");
    var exps = cmd_list.Exp;
    crawl_list(exps, explistdiv, "");
}

function reset_root() {
    // document.getElementsByClassName('pitch').innerText = "";
    document.querySelectorAll('.pitch').forEach(function(p) {
        p.innerText = "";
    });
}

function poll_for_update_root() {
    if (velato.programbuilder.root_note != undefined) {
        curr_note = velato.programbuilder.root_note.name;

        // is this the first note of the program or a new key?
        if (key != curr_note || rootNotSet) {
            console.log("set root note to " + velato.programbuilder.get_note_name(curr_note));
            key = curr_note;
            rootNotSet = false;

            // update notes in instruction box

            // all notes in the list
            notes_to_list = document.getElementsByClassName('instructions')[0].querySelectorAll('.note');
            for (let i = 0; i < notes_to_list.length; i++) {
                rootnote_idx = velato.notelist.findIndex(v => v.name == key && v.octave == 4);

                // get the interval name
                note = notes_to_list[i].querySelector(".int").innerText.trim();
                interval_set = rootnote_idx + note_translations[note.substring(1,note.length-1)];

                note_set = note_translations[note.substring(1,note.length-1)];
                
                note_name = "";
                for (let j = 0; j < note_set.length;j++) {
                    note_name += " ";
                    if (j > 0) note_name += "or ";
                    note_name += velato.programbuilder.get_note_name(velato.notelist[rootnote_idx + note_set[j]].name, curr_note);
                }
                notes_to_list[i].querySelector(".pitch").innerText = velato.programbuilder.get_note_name(note_name);
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

    octave = 3;

    rootnote_idx = velato.notelist.findIndex(v => v.name == key && v.octave == octave);
    notes = note_seq.split(" ");

    offset = play_toneset(notes, rootnote_idx, 0, now, 0);

    if (offset > 0) {
        play_toneset(notes, rootnote_idx, 1, now, offset+1);
    }
}
