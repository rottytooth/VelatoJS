
velato.programbuilder = {};

// velato.programbuilder
(function(pr) {
    pr.beginning_program = '<span class="str">"use strict"</span>;';
    pr.program_text = pr.beginning_program; // the entire text of the js program we're building

    _curr_token = new velato.token(); // lexemes (note intervals) building toward a token. Always for a single command or expression at a time
    _cmd_stack = []; // cmd tokens that have opened (but not yet closed) -- every program starts with a "set new root tone" command. Processed lifo

    _full_program = []; // velato program, all the notes no longer in _lex_stack

    var eventify_push = function(arr, callback) {
        arr.push = function(e) {
            Array.prototype.push.call(arr, e);
            callback(arr);
        };
    };

    // update display of curr token each time a new note is pushed to that list
    eventify_push(_curr_token.notes, function(updatedArr) {
        pr.write_notes("curr_cmd_notes", [_curr_token]);
    });

    // update display of program each time a new token is pushed to the program list
    eventify_push(_full_program, function(updatedArr) {
        pr.write_notes("velato_program", updatedArr);
        pr.write_js_program(updatedArr);

        // clear curr command
        pr.reset_token();
    });


    pr.root_note = null; // the current root note which we use to compare intervals

    // load command notes
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

    _preset_to_change_key = function() {
        // program begins as if "change key" has been called
        // pre-load the two stacks with that scenario
        _cmd_stack = [JSON.parse(JSON.stringify(pr.lexicon["Cmd"]["2nd"]))];
    }


    // This is the main entry point -- given a note, it will update the current command
    // and, if the command is complete, add to the final program
    pr.add_tone = function(note) {

        note.build_names();
        note.set_root(pr.root_note); // if there is no root_note, this will be undefined

        if (_curr_token == undefined) {
            _curr_token = new velato.token();
        }

        _curr_token.add_note(note);

        // report tone to screen
        root_str = "";
        if (pr.root_note != undefined) {
            root_str = `, root note: ${pr.root_note.with_octave()}`;
        }
        console.log(`registering ${note.with_octave()}${root_str}`);

        // 1. Check if there is a Command in the stack _cmd_stack
        if (_cmd_stack.length == 0) {
            // 2. If no, see if we now have enough tones to process as a command
            pr.check_cmd_token();

            // exit after processing command
            return;
        }

        // 3. If yes, does it (still) have children (from lexicon.json) in their child queue? 

        if (_cmd_stack.at(-1).children == undefined || _cmd_stack.at(-1).children.length == 0) {
            _throw_error("Looking for child nodes of cmd but none available", false); 
        }

        let retset = _get_first_child(_cmd_stack.at(-1), _cmd_stack.at(-1));
        let curr_child = retset[1];
        let curr_parent = retset[0];

        if (!_curr_token.print)
            _curr_token.print = curr_child.print;

        switch(curr_child.type) {
            case "NonFifthTone*": // a series of non-fifths until a fifth is sounded
                if (note.interval == "5th") {
                    // we are done and can process this expression
                    _full_program.push(_curr_token.clone());
                    curr_parent.children.shift(); // this should remove curr_child
                } else {
                    let value = note.interval_semitones;
                    if (value > 8)
                        value -= 2; // subtract 2 semitones if above a fifth
                    if (curr_child.seq_type == "char")
                        value = String.fromCharCode(value);
                    _curr_token.sequence.push(value);
                }
                break;
            case "Exp": // add an expression to the stack or complete it
                pr.check_exp_token();
                break;
            case "Tone": // a single tone as identifier
                _curr_token.sequence.push(note.varname);
                // remove the expression we have completed
                _full_program.push(_curr_token.clone());
                curr_parent.children.shift(); // this should remove curr_child
                break;
        }

        // if we've processed everything in the exp stack, pop the command
        if (_cmd_stack.at(-1).length == 0) {
            _cmd_stack.pop();
        }    
    }

    _get_first_child = function(parent, cmd) {

        if (cmd.children != undefined && cmd.children.length > 0) {
            return _get_first_child(cmd, cmd.children[0]);
        }
        return [parent, cmd];
    }


    // build toward a command
    pr.check_cmd_token = function() {

        for(let i = 0; i < _curr_token.notes.length; i++) {

            let matchedpath = pr.lexicon["Cmd"][_curr_token.notes[i].interval]
            if (matchedpath == undefined) {
                // we have hit a sequence not in the lexicon
                _throw_error("Invalid note sequence, resetting line", true);
            }
            if (!("type" in matchedpath) || matchedpath["type"] != "token") {
                // we are in a proper sequence but not at a token (end node)
                continue;
            }

            matchedpath = structuredClone(matchedpath);

            if (matchedpath["name"] == "SetRoot") {
                // special handling for SetRoot and Undo
                pr.root_note = null;
                _exp_queue = matchedpath["children"].slice(0);
                _curr_token.lexnode = matchedpath;
                _full_program.push(_curr_token);
                pr.reset_token();

            } else if (matchedpath["name"] == "EndBlock") {
                // add } to program
                _cmd_stack.pop(); // pop the last command
                _curr_token.lexnode = matchedpath;
                _full_program.push(_curr_token);
                pr.reset_token();

            } else if (matchedpath["childCmds"]) {
                //  if it requires child commands, keep it in the command stack
                _cmd_stack.push(matchedpath);
                _full_program.push(_curr_token);
                pr.reset_token();
           } else {
                // otherwise, process it right away
                _exp_queue = matchedpath["children"].slice(0);
                _curr_token.lexnode = matchedpath;
                _full_program.push(_curr_token);
                pr.reset_token();
            }
        }
    }

    // build toward a command
    pr.check_exp_token = function() {

        for(let i = 0; i < _curr_token.notes.length; i++) {

            let matchedpath = pr.lexicon["Exp"][_curr_token.notes[i].interval]
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
            js_program += stack[i].evaluate();
        }
        output.innerHTML = js_program;
    }

    /*
     * Writes notes to the screen as a png
     * 
     * PARAMS
     * element = where the png will be added
     * stack = an array of velato.token objects
     */
    pr.write_notes = function(element, stack) {
        if (stack.length == 0) return; 

        // clear curr cmd notes
        document.getElementById(element).innerHTML = "";
        
        notestxt = "";
        desctxt = "";
        commandtxt = "";

        let processed_notes = 0;
        for (let i = 0; i < stack.length; i++) {

            if (stack[i].notes.length == 0) continue;

            if (stack[i].lexnode != undefined) {
                if (Object.hasOwn(stack[i].lexnode),'notedesc')
                    commandtxt += stack[i].lexnode.notedesc;
                else if (Object.hasOwn(stack[i].lexnode),'desc')
                commandtxt += stack[i].lexnode.desc;
            }

            notes = [];
            notenames = [];
            stack[i].notes.forEach(el => {
                notes.push(el.vexname);
                notenames.push(el.displayname);

            notestxt += `${notes.join(" ")} $${notenames.join(" ")}$`;


            if (i <= stack.length) {
                notestxt += " |";        
            }

            processed_notes++;
        })};

        if (commandtxt.length > 0) {
            commandtxt = `text ++,.1,:q,${commandtxt}`;
        }

        const data = `
        tabstave notation=true tablature=false
        notes ${notestxt}
        ${commandtxt}
        `
        const VF = vextab.Vex.Flow;

        const renderer = new VF.Renderer(document.getElementById(element),
            VF.Renderer.Backends.SVG);
            

        // Initialize VexTab artist and parser.
        const artist = new vextab.Artist(10, 10, 750, { scale: 0.8 });
        const tab = new vextab.VexTab(artist);

        tab.parse(data);
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

    pr.reset_token = function() {
        _curr_token = new velato.token();
        document.getElementById("curr_cmd_notes").innerHTML = "";
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