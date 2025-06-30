// this is used only by the browser

if (!velato) var velato = {};

velato.web_display = (function() {
    // Responsible for all user feedback and display of the program

    const _get_note_list = function(node, set) {
        if (node.notes.length > 0)
            set.push.apply(set, node.notes);
        for(let i = 0; i < node.children.length; i++) {
            _get_note_list(node.children[i], set)
        }
        return set;
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

        // clear curr cmd notes
        document.getElementById(element).innerHTML = "";
        
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

            if (commands[i].desc != undefined) {
                if (commandtxt.length > 0)
                    commandtxt += "\ntext ";
                else
                    commandtxt = "text ++,.1,:q,"; 
                commandtxt += commands[i].desc + ",|";
            }

            notelist.forEach(not => {
                notestxt += `${not.vexname} $${not.displayname}$`;
            });

            if (i <= commands.length - 1) {
                notestxt += " |";        
            }

        };
        
        // add remaining notes and text for last line
        vextabstave_content += notestxt + "\n" + commandtxt + "\n";

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
        if (document.getElementById("curr_cmd_notes"))
            document.getElementById("curr_cmd_notes").innerHTML = "";
    }

    const write_full_program = (js_program) => {
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
        write_notes: write_notes,
        clear_curr_command: clear_curr_command,
        write_full_program: write_full_program,
        feedback: feedback,
        clear_feedback: clear_feedback,
        reset_display: reset_display
    }
})();
