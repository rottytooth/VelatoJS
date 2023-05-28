
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

        // clear curr command
        document.getElementById("curr_cmd_notes").innerHTML = "";
    });

    // update display of curr token each time a new note is pushed to that token
    eventify(_curr_token.notes, function(updatedArr) {
        pr.write_notes("curr_cmd_notes", [_curr_token]);
    });

    pr.root_note = null; // the current root note which we use to compare intervals


    // vexflow
    const { Factory, StaveNote, Accidental, Annotation } = Vex.Flow;

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

    pr.print = function(text, newline=false) {

        if (newline) {
            if (pr.program_text.length > 0)
                pr.program_text += "\n";
            for (let i = 0; i < _cmd_stack.length-1; i++) {
                pr.program_text += "\t";
            }
        }

        pr.program_text += text;

        // update on screen
        let program = document.getElementById("program_txt");
        program.innerHTML = pr.program_text;

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

    // format a string for the note
    pr.format_note = function(note) {
        return `${note.name} ${note.octave}`;
    }

    pr.reset_line = function() {
        _curr_token = velato.token();
        // var curr_cmd_notes = document.getElementById("curr_cmd_notes");
        // curr_cmd_notes.innerHTML = "";
    }

    // if there's an error in the command, we print it, and reset the command, so the
    // programmer can try again
    _throw_error = function(msg, syntax) {
        // pr.reset_line();
        if (msg == null || msg == "") {
            msg = "Could not determine command"; // default syntax error
        }
        if (syntax)
            throw(`SYNTAX ERROR : ${msg}`);
        else
            throw(`INTERNAL ERROR : ${msg}`);
    }

    // add an expression to the current line and clear expression tones
    // does not clear flags, only the current word
    _add_exp = function(exp) {
        pr.curr_line += exp + " ";
        _full_program = _full_program.concat(_lex_stack);
        _lex_stack = [];
        pr.print();
    }

    // print instruction for next item we're expecting
    _notate_child = function(cmd, expnum) {
        _feedback(`Creating ${cmd["name"]} command. Add ${cmd.children[expnum]["desc"]}`);
    }

    // build toward a command
    pr.check_cmd_token = function() {
        g = pr.lexicon["Cmd"];

        for(let i = 0; i < _curr_token.length; i++) {
            if (g[_curr_token[i].interval] === undefined) {
                pr.reset_line();
                _throw_error("Invalid note sequence, resetting line", true);
            }
            g = structuredClone(g[_curr_token[i].interval]);
            if ("type" in g && g["type"] == "token") {

                if (g["name"] == "SetRoot") {
                    // special handling for SetRoot and Undo
                    pr.root_note = null;
                } else if (g["name"] == "EndBlock") {
                    // add } to program
                    _cmd_stack.pop(); // pop the last command
                    _clear_cmd_box(); // done with command
                } else if (g["children"] || g["childCmds"]) {
                    //  if it requires child commands, keep it in the command stack
                    _cmd_stack.push(g);

                    // and if it has child expressions, put them in the expression stack
                    if (_exp_stack.length > 0) {
                        _throw_error("trying to add expressions when expression list already occupied");
                    }
                    _exp_stack.push.apply(_exp_stack, g["children"]);
                    _notate_child(g, 0);
                } else {
                    // otherwise, process it right away

                    _clear_cmd_box(); // done with command
                }

                // print if it has something to print
                if (g["print"])
                    pr.print(g["print"], true);
                else
                    pr.print('', true); // create blank
                
                // reset lexemes
                _full_program = _full_program.concat(_lex_stack);
                pr.write_program();
                _lex_stack = [];
            }
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

    pr.write_notes = function(element, stack) {

        if (stack.length == 0) return; 

        // clear curr cmd notes
        document.getElementById(element).innerHTML = "";
        
        const vf = new Factory({
            renderer: { elementId: element, width: 500, height: 150 },
        });

        const score = vf.EasyScore();
        const system = vf.System();

        const octave_drop = 1; // how many octaves lower to draw the note

        var notes = [];

        // loop through each token's notes
        for (let i = 0; i < stack.length; i++) {

            if (stack[i].notes.length == 0) continue;

            stack[i].notes.forEach(el => {

            var annotation = new Annotation(el.displayname);
            annotation.setFont("Ubuntu", "12pt", "Medium");
            annotation.setVerticalJustification(Annotation.VerticalJustify.BOTTOM);

            stemdir = StaveNote.STEM_UP;

            if (el.vexname > 'C' && el.octave == 6 || el.octave - octave_drop > 65) {
                stemdir = StaveNote.STEM_DOWN;
            }

            note = new StaveNote({ keys: [`${el.vexname}/${el.octave - octave_drop}`], duration: "4", stem_direction: stemdir})
            .addModifier(annotation);

            if (el.vexname.length > 1) {
                if (el.vexname[1] == "b") {
                    note.addModifier(new Accidental("b"));
                }
                else {
                    note.addModifier(new Accidental("#"));
                }
            }
            notes.push(note);
        })};

        if (notes.length == 0) return;
        
        score.set({ time: notes.length + "/4" });
        
        system
            .addStave({
            voices: [
                score.voice(notes)
            ]})
            .addClef('treble');

        vf.draw();
    }

    _complete_cmd = function() {
        // command is done. Clear it and clean up
        _clear_cmd_box(); // done with command
        _cmd_stack.pop();
        pr.write_program();
    }

    // This is the main entry point -- given a note, it will update the current command
    // and, if the command is complete, add to the final program
    pr.add_tone = function(note) {

        note.build_names();

        // check for root note first, as interval() will fail without it
        if (pr.root_note === null) { // we don't have a current root note
            pr.root_note = note; // set to current note

            token = new velato.token();
            token.js = `<span class=\"cmt\">// set root note to ${note.displayname}</span>`;
            token.newline = true;
            token.add_note(note);

            _full_program.push(token);
            return;
        }

        note.set_root(pr.root_note);
        _curr_token.notes.push(note);

        console.log(`registering ${pr.format_note(note)}, root note: ${pr.format_note(pr.root_note)}`);

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
            // pr.check_cmd_token();
        }

    }    
    
})(velato.programbuilder)