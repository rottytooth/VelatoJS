
velato.programbuilder = {};

// velato.programbuilder
(function(pr) {
    pr.beginning_program = '<span class="str">"use strict"</span>;';
    pr.program_text = pr.beginning_program; // the entire text of the js program we're building

    _curr_token = new velato.token(); // lexemes (intervals) building toward a token. Always for a single command or expression at a time
    _cmd_stack = []; // cmd tokens that have opened (but not yet closed)
    _exp_stack = []; // exp tokens yet to be processed. Always for a single commmand at a time. These are processed bottom-up, not up-down like _cmd_stack

    _full_program = []; // velato program, all the notes no longer in _lex_stack

    var eventify = function(arr, callback) {
        arr.push = function(e) {
            Array.prototype.push.call(arr, e);
            callback(arr);
        };
    };

    // update display of program each time a new token is pushed to the program
    eventify(_full_program, function(updatedArr) {
        pr.write_notes("velato_program", updatedArr);
        pr.write_js_program(updatedArr);

        // clear curr command
        // document.getElementById("curr_cmd_notes").innerHTML = "";
    });

    // update display of curr token each time a new note is pushed to that token
    eventify(_curr_token.notes, function(updatedArr) {
        pr.write_notes("curr_cmd_notes", [_curr_token]);
    });

    pr.root_note = null; // the current root note which we use to compare intervals


    // vexflow
    // const { Factory, StaveNote, Accidental, Annotation } = Vex.Flow;

    // load command notes
    var req_cmd_notes = new XMLHttpRequest();
    req_cmd_notes.overrideMimeType("application/json");
    req_cmd_notes.open('GET', "lexicon.json", true);
    req_cmd_notes.onload  = function() {
        pr.lexicon = JSON.parse(req_cmd_notes.responseText);

        // call draw_tones when both command notes are loaded and page is loaded
        if (document.readyState == 'complete') 
            draw_tones(pr.lexicon);
        else
            window.addEventListener("load", function() {
                draw_tones(pr.lexicon);
            });          
        
    };
    req_cmd_notes.send(null);

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
        _stackdepth = 0;
        root_display = document.getElementById("rootNote");
        root_display.innerText = "";
        pr.root_note = null;
        key = "C";
        pr.print();

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

    // build toward a command
    pr.check_cmd_token = function() {
        lex = pr.lexicon["Cmd"];

        for(let i = 0; i < _curr_token.notes.length; i++) {

            let matchedpath = lex[_curr_token.notes[i].interval]
            if (matchedpath === undefined) {
                // we have hit a sequence not in the lexicon
                _throw_error("Invalid note sequence, resetting line", true);
            }
            if (!("type" in matchedpath) || matchedpath["type"] != "token") {
                // we are in a proper sequence but not at a token (end node)
                continue;
            }

            matchedpath = structuredClone(matchedpath);

            if (lex["name"] == "SetRoot") {
                // special handling for SetRoot and Undo
                pr.root_note = null;

            } else if (lex["name"] == "EndBlock") {
                // add } to program
                _cmd_stack.pop(); // pop the last command

            } else if (lex["children"] || lex["childCmds"]) {
                //  if it requires child commands, keep it in the command stack
                _cmd_stack.push(lex);

                // and if it has child expressions, put them in the expression stack
                if (_exp_stack.length > 0) {
                    _throw_error("trying to add expressions when expression list already occupied");
                }
                _exp_stack.push.apply(_exp_stack, lex["children"]);
                _notate_child(lex, 0);
            } else {
                // otherwise, process it right away
                _full_program.push(_curr_token);
            }
            
            // reset lexemes
            // _full_program.push(_curr_token.clone());
            // pr.write_program();
            _curr_token = new velato.token();
        }
    }

    // build toward an expression
    pr.check_exp_token = function() {
        g = pr.lexicon["Exp"];

        for(let i = 0; i < _lex_stack.length; i++) {
            g = g[_lex_stack[i].interval];
            if ("type" in g && g["type"] == "token") {

                if (g["name"] == "CloseParens") {
                    // we are ending the expression block
                    // _cmd_stack[cmd_stack.length-1]
                } else {
                    // otherwise, process it right away
                    pr.print(g["print"]);
                }
                
                // reset lexemes
                _lex_stack = [];
            }
        }
    }

    pr.write_js_program = function(stack) {
        let output = document.getElementById("program_txt");

        let js_program = "<span class='str'>\"use strict\"</span>;\n";
        for(let i = 0; i < stack.length; i++) {
            js_program += stack[i].js;
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

        for (let i = 0; i < stack.length; i++) {

            if (stack[i].notes.length == 0) continue;

            notes = [];
            notenames = [];
            stack[i].notes.forEach(el => {
                notes.push(el.vexname);
                notenames.push(el.displayname);

            notestxt += `${notes.join(" ")} $${notenames.join(" ")}$`;


            if (i <= stack.length) {
                notestxt += " |";        
            }

        })};

        // Cn/4 D/5 | E@/4 F/5 G/5

        const data = `
        tabstave notation=true tablature=false
        notes ${notestxt}
        text ++,.1,:h,Declare var_d
        `
// text .11,
        const VF = vextab.Vex.Flow;

        const renderer = new VF.Renderer(document.getElementById(element),
            VF.Renderer.Backends.SVG);
            

        // Initialize VexTab artist and parser.
        const artist = new vextab.Artist(10, 10, 750, { scale: 0.8 });
        const tab = new vextab.VexTab(artist);

        tab.parse(data);
        artist.render(renderer);
    }


    _complete_cmd = function() {
        // command is done. Clear it and clean up
        _clear_cmd_box(); // done with command
        _cmd_stack.pop();
        // pr.write_program();
    }

    // This is the main entry point -- given a note, it will update the current command
    // and, if the command is complete, add to the final program
    pr.add_tone = function(note) {

        note.build_names();

        // check for root note first, as interval() will fail without it
        if (pr.root_note === null) { // we don't have a current root note
            pr.root_note = note; // set to current note

            newroot = pr.lexicon["Cmd"]["2nd"]["children"][0]; // new root note
            token = new velato.token();
            token.js = newroot.print.replace("{Tone}", note.displayname);
            token.add_note(note);

            _full_program.push(token);
            return;
        }

        // if we get here, there is a current root. set it in the note
        note.set_root(pr.root_note);
        _curr_token.notes.push(note);

        console.log(`registering ${note.with_octave()}, root note: ${pr.root_note.with_octave()}`);

        // if the open command has children (that are not other commands), address those first
        if (_cmd_stack.length > 0 && _exp_stack.length > 0) {
            // we are processing this thing
            switch(_exp_stack[0].type) {
                case "NonFifthTone*": // a series of non-fifths until a fifth is sounded
                    break;
                case "Exp": // add an expression to the stack or complete it
                    break;
                case "Tone": // a single tone as identifier
                    let varname = note.vraname;
                    pr.print(_exp_stack[0].print.replace("{Tone}",varname));
                    _exp_stack.shift(); // remove the expression we have completed
                    break;
            }

            // if that's the last item in the exp stack, pop the command
            if (_exp_stack.length == 0) {
                _complete_cmd();
            }
        } else {
            // otherwise, let's see where we are in building the next command
            pr.check_cmd_token();
        }

    }    
    
})(velato.programbuilder)