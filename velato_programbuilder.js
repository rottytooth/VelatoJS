
velato.programbuilder = {};

// velato.programbuilder
(function(pr) {
    pr.beginning_program = '<span class="str">"use strict"</span>;';
    pr.program_text = pr.beginning_program; // the entire text of the js program we're building

    _curr_token = new velato.token(); // lexemes (intervals) building toward a token. Always for a single command or expression at a time
    _cmd_stack = []; // cmd tokens that have opened (but not yet closed) -- every program starts with a "set new root tone" command
    _exp_stack = []; // exp tokens yet to be processed. Always for a single commmand at a time. These are processed bottom-up, not up-down like _cmd_stack

    _full_program = []; // velato program, all the notes no longer in _lex_stack

    var eventify_push = function(arr, callback) {
        arr.push = function(e) {
            Array.prototype.push.call(arr, e);
            callback(arr);
        };
    };

    // update display of curr token each time a new note is pushed to that token
    eventify_push(_curr_token.notes, function(updatedArr) {
        pr.write_notes("curr_cmd_notes", [_curr_token]);
    });

    // update display of program each time a new token is pushed to the program
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
        _cmd_stack = [pr.lexicon["Cmd"]["2nd"]];
        _exp_stack = [pr.lexicon["Cmd"]["2nd"]["children"][0]];
        _curr_token = new velato.token();
        _curr_token.lexnode = pr.lexicon["Cmd"]["2nd"]["children"][0];        
    }


    // This is the main entry point -- given a note, it will update the current command
    // and, if the command is complete, add to the final program
    pr.add_tone = function(note) {

        note.build_names();
        note.set_root(pr.root_note); // if there is no root_note, this will be undefined
        _curr_token.notes.push(note);

        root_str = "";
        if (pr.root_note != undefined) {
            root_str = `, root note: ${pr.root_note.with_octave()}`;
        }
        console.log(`registering ${note.with_octave()}${root_str}`);

        // if the open command has children (that are not other commands), address those first
        if (_exp_stack.length > 0) {
            // we are processing this thing
            switch(_exp_stack[0].type) {
                case "NonFifthTone*": // a series of non-fifths until a fifth is sounded
                    break;
                case "Exp": // add an expression to the stack or complete it
                    break;
                case "Tone": // a single tone as identifier
                    _exp_stack.shift(); // remove the expression we have completed

                    // if there is no root, and we're in "Tone", we must be setting the root
                    if (pr.root_note == undefined)
                        pr.root_note = note;

                    _full_program.push(_curr_token);
                    break;
            }

            // if that's the last item in the exp stack, pop the command
            if (_exp_stack.length == 0) {
                _cmd_stack.pop();
            }
        } else {
            // otherwise, let's see where we are in building the next command
            pr.check_cmd_token();
        }

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
                _exp_stack = matchedpath["children"].slice(0);
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
                _exp_stack = matchedpath["children"].slice(0);
                _curr_token.lexnode = matchedpath;
                _full_program.push(_curr_token);
                pr.reset_token();
            }
        }
    }

    // // build toward an expression
    // pr.check_exp_token = function() {
    //     g = pr.lexicon["Exp"];

    //     for(let i = 0; i < _lex_stack.length; i++) {
    //         g = g[_lex_stack[i].interval];
    //         if ("type" in g && g["type"] == "token") {

    //             if (g["name"] == "CloseParens") {
    //                 // we are ending the expression block
    //                 // _cmd_stack[cmd_stack.length-1]
    //             } else {
    //                 // otherwise, process it right away
    //                 pr.print(g["print"]);
    //             }
                
    //             // reset lexemes
    //             _lex_stack = [];
    //         }
    //     }
    // }

    pr.write_js_program = function(stack) {
        let output = document.getElementById("program_txt");

        let js_program = "<span class='str'>\"use strict\"</span>;\n";
        for(let i = 0; i < stack.length; i++) {
            if (stack[i].lexnode != undefined && Object.hasOwn(stack[i].lexnode, 'print')) {
                let base_print = stack[i].lexnode.print;
                base_print = base_print.replace("{Tone}",stack[i].notes[0].displayname);
                js_program += base_print;
            }
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