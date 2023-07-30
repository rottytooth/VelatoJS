
velato.programbuilder = {};
/*
 * builds the js program
 * interprets individual notes
 * _print_output() writes to particular divs
 */

(function(pr) {
    pr.beginning_program = '<span class="str">"use strict"</span>;';
    pr.program_text = pr.beginning_program; // the entire text of the js program we're building
    
    _cmd_stack = []; // stack of cmd tokens that have opened but not yet closed. A command is popped when we meet its closing bracket

    _curr_cmd = undefined // placeholder for the command we are currently building

    _full_program = []; // we build the velato program and js program from this

    pr.root_note = null; // the current root note which we use to compare intervals


    //#region load command notes
    var req_cmd_notes = new XMLHttpRequest();
    req_cmd_notes.overrideMimeType("application/json");
    req_cmd_notes.open('GET', "lexicon.json", true);
    req_cmd_notes.onload  = function() {
        pr.lexicon = JSON.parse(req_cmd_notes.responseText);

        // pre-load with command to set key
        _preset_to_change_key();

        // call draw_tones when both command notes are loaded and page is loaded
        if (document.readyState == 'complete') 
            draw_tones(pr.lexicon);
        else
            window.addEventListener("load", function() {
                draw_tones(pr.lexicon);
            });          
        
    };
    req_cmd_notes.send(null);
    //#endregion

    //#region write events
    var eventify_push = function(arr, callback) {
        arr.push = function(e) {
            Array.prototype.push.call(arr, e);
            callback(arr);
        };
    };  

    // update display of program each time a new token is pushed to the program list
    eventify_push(_full_program, function(updatedArr) {
        pr.write_notes("velato_program", updatedArr);
        pr.write_js_program(updatedArr);
    });

    //#endregion

    _preset_to_change_key = function() {
        // program begins as if "change key" has been called
        // pre-load the stack with that scenario
        pr.reset_token();
        _curr_cmd.setlexpath(["Cmd","2nd"]);
    }

    pr.reset_token = function() {
        if (pr.lexicon === undefined)
            throw new Error("Attempting to create cmd obj without lexicon");
        _curr_cmd = new velato.token(pr.lexicon);
        _curr_cmd.indent = _cmd_stack.length;
        document.getElementById("curr_cmd_notes").innerHTML = "";
    }

    // This is the main entry point -- given a note, it will update the _curr_cmd
    // and evaluate. returns bool to indicate program is complete
    pr.add_tone = function(note) {

        note.set_root(pr.root_note); // if there is no root_note, this will be undefined

        // report tone to screen
        root_str = "";
        if (pr.root_note != undefined) {
            root_str = `, root note: ${pr.root_note.with_octave()}`;
        }
        console.log(`registering ${note.with_octave()}${root_str}`);
        
        // Is the command we're building completely determined?
        if (_curr_cmd.lexpath == undefined) {
            // No, we need to add another note and re-test for completeness
            _curr_cmd.add_note(note);
            pr.check_cmd_token();
            pr.write_notes("curr_cmd_notes", [_curr_cmd]); // display it
            return;
        }

        // Yes, so we must be building its children (tones, expressions, etc)
        if (_curr_cmd.children.length == 0) {
            _throw_error("Unresolved command has no child nodes", false); 
        }

        { // resolve child
            let [, child] = _get_first_unresolved_child(_curr_cmd, _curr_cmd);
            console.log(child);

            if (child !== undefined)
                pr.resolve_child(note, child);
        }
        // is child resolved?
        let [parent, child] = _get_first_unresolved_child(_curr_cmd, _curr_cmd);

        // no child returned, meaning command is DONE
        if (child === undefined) {

            // SOME COMMANDS affect the lexing of the program. Deal with that now

            //TODO: if it's an undo, handle it now!

            // if it's a root note, set that rootnote
            if (_curr_cmd.name == "SetRoot" && _curr_cmd.children.length > 0 && _curr_cmd.children[0].notedesc == "New Root Tone") {
                pr.root_note = _curr_cmd.children[0].notes[0];
            }

            // move to the final program
            _full_program.push(_curr_cmd);

            // if it has child commands, also add it to the command stack
            if (_curr_cmd.childCmds)
                _cmd_stack.push(_curr_cmd);

            // reset
            pr.reset_token();
        }

        pr.write_notes("curr_cmd_notes", [_curr_cmd]);

        return false; // TODO: check for program completeness and return here
    }

    pr.resolve_child = function(note, token) {

        token.notes.push(note);

        switch(token.type) {
            case "NonFifthTone*": // a series of non-fifths until a fifth is sounded
                if (note.interval == "5th") {
                    if (token.seq_type == "char")
                        token.sequence = String.fromCharCode(token.sequence);
                    token.resolved = true;
                } else {
                    let value = note.interval_semitones;
                    if (value > 8)
                        value -= 2; // subtract 2 semitones if above a fifth
                    token.sequence.push(value);
                }
                break;
            case "Exp": // add an expression to the stack or complete it
                pr.check_exp_token(note, token);
                break;
            case "Tone": // a single tone as identifier
                token.sequence.push(note.varname);
                token.resolved = true;
                break;
        }
    }

    _get_first_unresolved_child = function(parent, cmd) {
        // get the first child still hungry for more notes
        // we do not look at the command itself (which is always true)

        if (cmd.children != undefined && cmd.children.length > 0) {
            for (let i = 0; i < cmd.children.length; i++) {
                // if it's resolved and have no children, return
                if (!cmd.children[i].resolved && 
                    (cmd.children[i].children === undefined ||
                        cmd.children[i].children.length == 0)) {
                    return [cmd, cmd.children[i]];
                // else if it has children, test those
                } else if (cmd.children[i].children !== undefined &&
                    cmd.children[i].children.length > 0) {
                        return _get_first_unresolved_child(cmd, cmd.children[i]);
                }
            }
            return [undefined, undefined];
        }
    }

    // build toward a command
    pr.check_cmd_token = function() {

        let path = ["Cmd"]; // set for cmd only

        for(let i = 0; i < _curr_cmd.notes.length; i++) // build path from intervals
            path.push(_curr_cmd.notes[i].interval);

        matchedpath = path.reduce((o, n) => o[n], pr.lexicon)

        if (matchedpath == undefined) {
            // we have hit a sequence not in the lexicon
            _throw_error("Invalid note sequence, resetting line", true);
        }
        if ("node_type" in matchedpath && matchedpath["node_type"] == "Category") {
            //TODO: print what we're in to the screen
            _feedback(`adding ${matchedpath["desc"]}`);
        }
        if (!("node_type" in matchedpath) || matchedpath["node_type"] != "Token") {
            // we are in a proper sequence but not at a token (end node)
            return;
        }

        _curr_cmd.setlexpath(path);

        if (matchedpath["name"] == "EndBlock") {
            _cmd_stack.pop(); // pop the last command
            //FIXME: do we do this here?

        } 
    }

    // build toward a command
    pr.check_exp_token = function() {

        for(let i = 0; i < _curr_cmd.notes.length; i++) {

            let matchedpath = pr.lexicon["Exp"][_curr_cmd.notes[i].interval]
            if (matchedpath == undefined) {
                // we have hit a sequence not in the lexicon
                _throw_error("Invalid note sequence, resetting line", true);
            }
            if (!("type" in matchedpath) || matchedpath["type"] != "token") {
                // we are in a proper sequence but not at a token (end node)
                continue;
            }

            matchedpath = structuredClone(matchedpath);
        }
    }    


    pr.write_js_program = function(stack) {
        let output = document.getElementById("program_txt");

        let js_program = "<span class='str'>\"use strict\"</span>;\n";
        for(let i = 0; i < stack.length; i++) {
            js_program += stack[i].print();
        }
        output.innerHTML = js_program;
    }

    _get_note_list = function(node, set) {
        if (node.notes.length > 0)
            set.push.apply(set, node.notes);
        for(let i = 0; i < node.children.length; i++) {
            _get_note_list(node.children[i], set)
        }
        return set;
    }

    /*
     * Writes notes to the screen as a png
     * 
     * PARAMS
     * element = where the png will be added
     * stack = an array of velato.token command objects
     */
    pr.write_notes = function(element, commands) {
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

            if (notecount > velato.NOTES_PER_LINE && i > 0){
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

    _feedback = function(desc, exp) {
        var cmd = document.getElementById("feedback");
        style = 'desc';
        if (exp) style = 'exp';
        cmd.innerHTML += ` <span class='${style}'>${desc}</span>`;
    }

    _clear_feedback = function() {
        var errs = document.getElementById("feedback");
        errs.innerHTML = "";
    }

    pr.reset_program = function() {
        root_display = document.getElementById("rootNote");
        root_display.innerText = "";
        pr.root_note = null;
        key = "C";
        _preset_to_change_key();
        
        pr.program_text = pr.beginning_program;
    }



    // if there's an error in the command, we print it, and reset the command, so the
    // programmer can try again
    _throw_error = function(msg, syntax) {
        pr.reset_token();
        if (msg == null || msg == "") {
            msg = "Could not determine command"; // default syntax error
        }
        if (syntax)
            throw(`SYNTAX ERROR : ${msg}`);
        else
            throw(`INTERNAL ERROR : ${msg}`);
    }

    // print instruction for next item we're expecting
    _notate_child = function(cmd, expnum) {
        _feedback(`Creating ${cmd["name"]} command. Add ${cmd.children[expnum]["desc"]}`);
    }

})(velato.programbuilder)