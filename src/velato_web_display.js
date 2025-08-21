if (!velato) var velato = {};

if (typeof module !== 'undefined' && module.exports) { 
    const { start } = require('node:repl');
    const fs = require('node:fs'); // temporary, for testing

    velato.c = require('./velato_constants');
}

let DEBUG = true;

velato.web_display = (function() {
    // Responsible for all user feedback and display of the program

        // Generator to iterate over notes in a notelist
        function* noteIterator(notelist) {
            for (let note of notelist) {
                yield note;
            }
        }

    const _get_note_list = function(node, set) {
        if (node.notes.length > 0) {
            let notes = node.notes;
            if (node.type !== "Cmd" && notes.length > 0) {
                notes[0].exp_name = node.print();
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

            notecount += notelist.length; // increase number of notes we're putting in this measure

            if (notecount > velato.c.NOTES_PER_LINE && i > 0){
                // start a new line if we've printed at least one measure on this line and adding the current measure would put us over the notes per line
                vextabstave_content += notestxt + "\n" + commandtxt + "\n\noptions space=40\n\n" + newlinestart;
                notecount = 0;
                notestxt = "";
                commandtxt = "";
            }

            if (commands[i].desc != undefined) {
                if (commandtxt.length > 0)
                    commandtxt += "\ntext ";
                else
                    commandtxt = "text ++,.1,:q,"; 
            }

            let isFirstNote = true;
            for (let note of noteIterator(notelist)) {
                notestxt += `${note.vexname} $${note.displayname}$`;
                if (isFirstNote) {
                    if (commands[i].desc != undefined) {
                        commandtxt += commands[i].desc + ",|";
                    }
                    isFirstNote = false;
                } else {
                    commandtxt += ", ";
                    // we're going through notes here, not children
                    if (commands[i].type != "Tone") {
                        // get notes 
                        // print commands[i]
                    }
                    // FIXME: check here for expression to add
                }
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
    const write_notes = (final_program, commands) => {

        element = "curr_cmd_notes";
        if (final_program) {
            element = "velato_program";
        }
        if (commands.length == 0) return; 

        if (commands.length == 1 && commands[0].print().length == 0) return;

        // do callback (for tests) before writing to doc incase doc doesn't exist
        if (velato.web_display.write_notes_callback) {
            velato.web_display.write_notes_callback(final_program, commands);
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

    const write_full_program = (full_program, js_program) => {
        if (typeof document == 'undefined') return;
        let output = document.getElementById("program_txt");
        output.innerHTML = js_program;
    }

    const feedback = function(desc, exp) {
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
        write_full_program: write_full_program,
        feedback: feedback,
        clear_feedback: clear_feedback,
        reset_display: reset_display
    }
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = velato.web_display;
}