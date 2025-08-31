if (!velato) var velato = {};

if (typeof module !== 'undefined' && module.exports) { 
    const { start } = require('node:repl');
    const fs = require('node:fs'); // temporary, for testing

    velato.c = require('./velato_constants');
}

let DEBUG = false;

velato.web_display = (function() {
    // Responsible for all user feedback and display of the program

    // Generator to iterate over notes in a notelist
    function* noteIterator(notelist) {
        for (let note of notelist) {
            yield note;
        }
    }

    const _get_note_list = function(node, set) {
        // get the node's notes and attach its print() to the first note
        if (node.notes.length > 0) {
            let notes = node.notes;

            // FIXME: Too much special handling here. exp_name should already be correct
            // WARNING: The tests often don't catch timing issues here
            if (notes.length > 0 && (!notes[0].exp_name || node.type == "NonFifthTone*")) {

                notes[0].exp_name = node.print(true);
            }
            set.push.apply(set, node.notes);
        }
        for(let i = 0; i < node.children.length; i++) {
            _get_note_list(node.children[i], set)
        }
        return set;
    }

    const build_vextab = (commands) => {
        let notestxt = "";
        let commandtxt = "";

        let notecount = 0; // how many notes we have printed onto this line so far

        const newlinestart = "tabstave notation=true tablature=false\nnotes "

        let vextabstave_content = newlinestart;

        for (let i = 0; i < commands.length; i++) {

            let notelist = _get_note_list(commands[i], []);

            if (notelist.length == 0) continue;

            notecount += notelist.length;

            if (notecount > velato.c.NOTES_PER_LINE && i > 0){
                // start a new line if we've printed at least one measure on this line and adding the current measure would put us over the notes per line
                vextabstave_content += notestxt + "\n" + commandtxt + "\n\noptions space=40\n\n" + newlinestart;
                notecount = 0;
                notestxt = "";
                commandtxt = "";
            }

            if (commandtxt.length == 0)
                commandtxt = "text ++,.1,:q,"; 
            else
                commandtxt += "\ntext ";

            let lastIsBlank = false;
            let isFirstNote = true;
            for (let note of noteIterator(notelist)) {
                notestxt += `${note.vexname} $${note.displayname}$`;
                if (isFirstNote) {
                    // This is the first note, so is the command
                    commandtxt += commands[i].print(true);
                    isFirstNote = false;
                } else {
                    if (commandtxt.length > 0 && commandtxt[commandtxt.length-1] == ",") {
                        commandtxt += " ";
                    }
                    commandtxt += ", ";
                    commandtxt += note.exp_name || "";
                    lastIsBlank = !note.exp_name;
                }
            }
            if (lastIsBlank || commandtxt.trim()[commandtxt.trim().length - 1] == ",") {
                commandtxt += "|";
            }

            if (i <= commands.length - 1) {
                notestxt += " |";        
            }

        };
        
        // add remaining notes and text for last line
        vextabstave_content += notestxt + "\n" + commandtxt + "\n";

        if (DEBUG) {
            console.log("VexTab content: ", vextabstave_content);
        }

        return vextabstave_content;
    }

    /**
     * Writes notes to the screen as a png
     * 
     * PARAMS
     * final_program = write to current command or final program?
     * stack = an array of velato.token command objects
     **/
    const write_notes = (full_program, commands) => {

        element = "curr_cmd_notes";
        if (full_program) {
            element = "velato_program";
        }
        if (commands.length == 0) return; 

        // if there's only one command and it has no notes and none of its children have notes
        if (commands.length == 1 && 
            commands[0].notes.length == 0 &&
            (!commands[0].children || 
                commands[0].children.every(child => Array.isArray(child.notes) && child.notes.length == 0))) 

            return;

        // do callback (for tests) before writing to doc incase doc doesn't exist
        if (velato.web_display.write_notes_callback) {
            velato.web_display.write_notes_callback(full_program, commands);
        }

        if (typeof document == 'undefined') return;

        // clear curr cmd notes
        document.getElementById(element).innerHTML = "";
        
        const vextabstave_content = build_vextab(commands);
        const VF = vextab.Vex.Flow;

        const renderer = new VF.Renderer(document.getElementById(element),
            VF.Renderer.Backends.SVG);
            

        // Initialize VexTab artist and parser
        const artist = new vextab.Artist(10, 10, 750, { scale: 0.8 });
        const tab = new vextab.VexTab(artist);

        tab.parse(vextabstave_content);
        artist.render(renderer);
    }

    const clear_curr_command = () => {
        if (typeof document !== 'undefined' && document.getElementById("curr_cmd_notes"))
            document.getElementById("curr_cmd_notes").innerHTML = "";
    }

    const write_js_program = (program_is_complete, js_program) => {
        // TODO: program_is_complete will mark that the program should now be run

        if (typeof document == 'undefined') return;
        let output = document.getElementById("program_txt");
        output.innerHTML = js_program;
    }

    const feedback = function(desc, exp) {
        if (typeof document == 'undefined') return;

        var cmd = document.getElementById("feedback");
        style = 'desc';
        if (exp) style = 'exp';
        cmd.innerHTML += ` <span class='${style}'>${desc}</span>`;
    }

    const clear_feedback = function() {
        // FIXME: very possibly never called
        var errs = document.getElementById("feedback");
        errs.innerHTML = "";
    }

    const reset_display = function() {
        root_display = document.getElementById("rootNote");
        root_display.innerText = "";
    }

    return {
        build_vextab: build_vextab,
        write_notes: write_notes,
        clear_curr_command: clear_curr_command,
        write_js_program: write_js_program,
        feedback: feedback,
        clear_feedback: clear_feedback,
        reset_display: reset_display
    }
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = velato.web_display;
}