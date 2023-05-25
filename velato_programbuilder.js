
var velato = {};

velato.programbuilder = {};

// velato.programbuilder
(function(pr) {
    pr.beginning_program = '<span class="str">"use strict"</span>;';
    pr.program_text = pr.beginning_program; // the entire text of the js program we're building

    _lex_stack = []; // lexemes (intervals) building toward a token. Always for a single command or expression at a time
    _cmd_stack = []; // cmd tokens that have opened (but not yet closed)
    _exp_stack = []; // exp tokens yet to be processed. Always for a single commmand at a time. These are processed bottom-up, not up-down like _cmd_stack

    // pr.curr_line = ""; // the current line of code we're building (in JS)
    pr.root_note = null; // the current root note which we use to compare intervals
    pr.notelist = []; // a list of one octave of notes, used as reference to calculate intervals

    const DEFAULT_ACCIDENTALS = ["A♭","B♭","C♯","E♭","F♯"];

    const SPECIAL_KEYS = {
        "C": {
            "acc": ["F♯"],
            "def": "♭"
        },
        "G": {
            "acc": ["B♭","E♭"],
            "def": "♯"
        },
        "D": {
            "acc": ["B♭"],
            "def": "♯"
        }
    };

    pr.note_translations = {
        "root" : [0],
        "2nd" : [1,2],
        "3rd" : [3,4],
        "4th" : [5],
        "5th" : [6,7],
        "6th" : [8,9],
        "7th" : [10,11]
    }


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
    

    // Build the list of all twelve tones
    // NOTE: this is called from outside and must be called before add_note() is used
    pr.create_notelist = function(noteset) {
        for (var i = 0; i < 12; i++) {
            pr.notelist += noteset[i].name; 
        }
    }

    // Find the interval from note1 to note2 within an octave
    pr.interval = function(note1, note2) {
        diff = (note2.index - note1.index) % 12;
        while (diff < 0) 
            diff += 12;
        diff = Math.abs(diff); // to remove -0
        return diff;
    }

    pr.build_accidental = function(names, root) {

        acc = (names.length === 2); // passed note has an accidental

        if (acc) {
            flatv = names.find(x => x.includes("♭"));
            sharpv = names.find(x => x.includes("♯"));
        } else 
            var name = names[0];

        // if both root and passed note have accidentals
        if (acc) { 
            // if the note is the root
            if (root === flatv || root === sharpv) {
                return root;
            }
            // if the root is a flat, we also sound the flat
            if (root.includes("♭")) {
                return flatv;
            }
            // check if it's a "special" key whose minor is in flats and major not so
            if (root in SPECIAL_KEYS) {
                if (flatv in SPECIAL_KEYS[root].acc)
                    return flatv;
                if (sharpv in SPECIAL_KEYS[root].acc)
                    return sharpv;
                if (SPECIAL_KEYS[root].def == "♭")
                    return flatv;
                return sharpv;
            }
            // otherwise, it's the sharp that wins
            return sharpv;
        }

        // e.g. B is sounded in key of B♭
        if (root.length == 2 && root.substring(0,1) == name) {
            return root.substring(0,1) + "♮";
        }

        // at the stage, only the naturals should be left, with no special treatment
        return name;
    }

    pr.get_note_name = function(name, root) {
        let names = name.split("/");
        names = names.map(e => e.trim());

        if (root == undefined)
        {
            if (name.includes("/")) {
                for(let i = 0; i < 2; i++) {
                    const newNote = DEFAULT_ACCIDENTALS.find(x => x == names[i]);
                    if (newNote) {
                        return newNote;
                    }
                }
            } 
            return name;
        }
        if (typeof root !== "string" && !(root instanceof String))
            root = root.name;
        return pr.build_accidental(names, pr.get_note_name(root));
    }

    // convert a tone to a variable name (within an octave, so all C's are the same)
    pr.note_to_varname = function(note) {
        varname = note.name.replace("/", "").replace(" ","").replace("♯","s").replace("♭","b").replace(" ","_");
        return `var_${varname}`;
    }

    _dress = function(desc, exp) {
        var cmd = document.getElementById("curr_cmd_notes");
        style = 'desc';
        if (exp) style = 'exp';
        cmd.innerHTML += ` <span class='${style}'>${desc}</span>`;
    }

    _clear_err = function() {
        var errs = document.getElementById("error");
        errs.innerHTML = "";
    }

    _clear_cmd_box = function() {
        var curr_cmd_notes = document.getElementById("curr_cmd_notes");
        curr_cmd_notes.innerHTML = "";
    }

    pr.remove_last_line = function() {
        loc = pr.program_text.lastIndexOf("\n");
        pr.program_text = pr.program_text.substring(0, loc);

        // update on screen
        let program = document.getElementById("program_txt");
        program.innerHTML = pr.program_text;
    }

    // prints current line of js and resets it
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
        _lex_stack = [];
        var curr_cmd_notes = document.getElementById("curr_cmd_notes");
        curr_cmd_notes.innerHTML = "";
    }

    pr.update_root = function(new_root) {
        pr.root_note = new_root;
        root_display = document.getElementById("rootNote");
        root_display.innerText = pr.get_note_name(new_root.name);
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
        _lex_stack = [];
        pr.print();
    }

    // print instruction for next item we're expecting
    _notate_child = function(cmd, expnum) {
        _dress(`Creating ${cmd["name"]} command. Add ${cmd.children[expnum]["desc"]}`);
    }

    // build toward a command
    pr.check_cmd_token = function() {
        g = pr.lexicon["Cmd"];

        for(let i = 0; i < _lex_stack.length; i++) {
            if (g[_lex_stack[i].interval] === undefined) {
                pr.reset_line();
                _throw_error("Invalid note sequence, resetting line", true);
            }
            g = structuredClone(g[_lex_stack[i].interval]);
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

    // This is the main entry point -- given a note, it will update the current command
    // and, if the command is complete, add to the final program
    pr.add_tone = function(note) {
        if (pr.notelist.length == 0) {
            _throw_error("The note list needs to be set before calling pr.add_tone", true);
        }

        // check for root note first, as interval() will fail without it
        if (pr.root_note === null) { // we don't have a current root note
            pr.update_root(note);
            pr.print("<span class=\"cmt\">// set root note to " + pr.get_note_name(note.name) + "</span>", true);
            _clear_cmd_box(); // done with command
            return;
        }

        note.interval_semitones = pr.interval(pr.root_note, note);
        note.interval = Object.keys(pr.note_translations).find(key => pr.note_translations[key].includes(note.interval_semitones)) 
        note.root = pr.root_note;
        _lex_stack.push(note);

        console.log("registering " + pr.format_note(note));
        if (pr.root_note != null)
            console.log("Root Note: " + pr.format_note(pr.root_note));

        // if the open command has children (that are not other commands), address those first
        if (_cmd_stack.length > 0 && _exp_stack.length > 0) {
            // we are processing this thing
            switch(_exp_stack[0].type) {
                case "NonFifthTone*": // a series of non-fifths until a fifth is sounded
                    break;
                case "Exp": // add an expression to the stack or complete it
                    break;
                case "Tone": // a single tone as identifier
                    let varname = pr.note_to_varname(note);
                    pr.print(_exp_stack[0].print.replace("{Tone}",varname));
                    _exp_stack.shift(); // remove first element of array
                    break;
            }

            // if that's the last item in the exp stack, pop the command
            if (_exp_stack.length == 0) {
                _clear_cmd_box(); // done with command
                _cmd_stack.pop();
            }
        } else {
            // otherwise, let's see where we are in building the next command
            pr.check_cmd_token();
        }

    }    
    
})(velato.programbuilder)


