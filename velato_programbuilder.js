if (!velato) var velato = {};

velato.programbuilder = {};
/*
 * builds the js program
 * interprets individual notes
 * _print_output() writes to particular divs
 * 
 * THIS WORKS DIRECTLY WITH THE BROWSER 
 * FIXME: output and formatting should be moved to a separate file
 */

if (typeof module !== 'undefined' && module.exports) { 
    const { start } = require('node:repl');
    const fs = require('node:fs'); // temporary, for testing

    velato.c = require('./velato_constants');
    velato.note = require('./velato_note');
    velato.token = require('./velato_token');

    // for node, this will replace the web display with the tester
    velato.web_display = require('./tests/velato_tester_display');
}

(function(pr) { 
    pr.beginning_program = '';

    pr.program_text = pr.beginning_program; // the entire text of the js program we're building
    
    const _cmd_stack = []; // stack of cmd tokens that have opened but not yet closed. A command is popped when we meet its closing bracket

    var _curr_cmd = undefined // placeholder for the command we are currently building

    const _full_program = []; // we build the velato program and js program from this

    pr.root_note = null; // the current root note which we use to compare intervals

    const _preset_to_change_key = function() {
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

        velato.web_display.clear_curr_command();
    }

    //#region load command notes
    
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js: load lexicon.json with fs
        const fs = require('node:fs');
        pr.lexicon = JSON.parse(fs.readFileSync('lexicon.json', 'utf8'));
        // pre-load with command to set key
        _preset_to_change_key();
    } else {
        // Browser: load lexicon.json with XMLHttpRequest
        var req_cmd_notes = new XMLHttpRequest();
        req_cmd_notes.overrideMimeType("application/json");
        req_cmd_notes.open('GET', "lexicon.json", true);
        req_cmd_notes.onload  = function() {
            pr.lexicon = JSON.parse(req_cmd_notes.responseText);

            // pre-load with command to set key
            _preset_to_change_key();

            if (ready_to_draw_tones) ready_to_draw_tones(pr.lexicon);
        };
        req_cmd_notes.send(null);
    }
    //#endregion

    //#region write events
    var _eventify_push = function(arr, callback) {
        arr.push = function(e) {
            Array.prototype.push.call(arr, e);
            callback(arr);
        };
    };  

    // update display of program each time a new token is pushed to the program list
    _eventify_push(_full_program, function(updatedArr) {
        velato.web_display.write_notes(true, updatedArr);
        pr.write_js_program(updatedArr);
    });

    //#endregion


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
            velato.web_display.write_notes(false, [_curr_cmd]); // display it
            return;
        }

        // Yes, so we must be building its children (tones, expressions, etc)
        if (_curr_cmd.children.length == 0) {
            _throw_error("This note does not lead to a valid command", true); 
        }

        { // resolve child
            let [, child] = _get_first_unresolved_child(_curr_cmd, _curr_cmd);
            console.log(child);

            if (child !== undefined)
                pr.resolve_child(note, child);
        }
        // is child resolved?
        let [, child] = _get_first_unresolved_child(_curr_cmd, _curr_cmd);

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

        velato.web_display.write_notes(false, [_curr_cmd]);

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
            velato.web_display.feedback(`adding ${matchedpath["desc"]}`);
            return;
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
    pr.check_exp_token = function(note, token) {

        let path = ["Exp"]; // set for exp only

        for(let i = 0; i < _curr_cmd.notes.length; i++) // build path from intervals
            path.push(token.notes[i].interval);

        matchedpath = path.reduce((o, n) => o[n], pr.lexicon)

        if (matchedpath == undefined) {
            // we have hit a sequence not in the lexicon
            _throw_error("Invalid note sequence, resetting line", true);
        }
        if ("node_type" in matchedpath && matchedpath["node_type"] == "Category") {
            //TODO: print what we're in to the screen
            velato.web_display.feedback(`adding ${matchedpath["desc"]}`);
            return;
        }
        if (!("node_type" in matchedpath) || matchedpath["node_type"] != "Token") {
            // we are in a proper sequence but not at a token (end node)
            return;
        }
            
        matchedpath = structuredClone(matchedpath);
        _curr_cmd.notes = token.notes; // is this right?
        _curr_cmd.children.push(matchedpath);
    }    


    pr.write_js_program = function(stack) {
        let js_program = pr.beginning_program;
        if (pr.beginning_program) js_program += "\n";
        for(let i = 0; i < stack.length; i++) {
            js_program += stack[i].print();
        }
        velato.web_display.write_full_program(js_program);
    }

    pr.reset_program = function() {
        velato.web_display.reset_display();
        pr.root_note = null;
        key = "C";
        _preset_to_change_key();
        
        pr.program_text = pr.beginning_program;
    }



    // if there's an error in the command, we print it, and reset the command, so the
    // programmer can try again
    const _throw_error = function(msg, syntax) {
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
    const _notate_child = function(cmd, expnum) {
        velato.web_display.feedback(`Creating ${cmd["name"]} command. Add ${cmd.children[expnum]["desc"]}`);
    }

})(velato.programbuilder)

if (typeof module !== 'undefined' && module.exports) {
    module.exports = velato.programbuilder;
}
