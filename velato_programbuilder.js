
var velato = {};

velato.programbuilder = {};

// velato.programbuilder
(function(pr) {
    pr.program_text = ""; // the entire text of the js program we're building
    pr.curr_token = []; // intervals for the current word (a command, expression, or number we are building)
    pr.curr_line = ""; // the current line of code we're building (in JS)
    pr.root_note = null; // the current root note which we use to compare intervals
    pr.notelist = []; // a list of one octave of notes, used as reference to calculate intervals

    // Flags for the type of input we're dealing with (expression, digit, etc)
    // and for where we are in the program stack.
    // These capture the current state of the program input.
    let _building_expression= false; // we are about to begin an expression or are building one
    let _building_expression_childcommands = false; // we are building an expression and will then build child commands, such as in while (expression) { childcommands }
    let _stackdepth = 0; // how deep we are in commands {}. We need "end block" commands to break out of each
    let _parensdepth = 0; // for expressions; all expressions start with a ( which is implied, and end with an explicit )
    let _building_int = false; // building an integer
    let _building_char = false; // building a char (needs to close out the fromCharCode() call)
    let _building_float = false; // building a floating point number

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

    // convert a tone to a variable name (within an octave, so all C's are the same)
    pr.note_to_varname = function(note) {
        varname = note.name.replace("/", "").replace(" ","").replace("#","s").replace(" ","_");
        return `var_${varname}`;
    }

    _print_output = function() {
        var program = document.getElementById("program_txt");
        program.innerHTML = pr.program_text + pr.curr_line;
        hljs.highlightAll(); // highlight.js 
        _clear_err();
        pr.curr_token = []; // if we're updating, there is a new token to print, meaning we should clear this
    }

    _clear_err = function() {
        var errs = document.getElementById("error");
        errs.innerHTML = "";
    }

    // prints current line and resets it
    pr.complete_line = function(line) {
        for (let i = 0; i < _stackdepth; i++) {
            pr.program_text += "\t";
        }
        pr.program_text += line + "\n";

        pr.reset_line();

        _clear_err(); // clear any errors from the previous line

        // update on screen
        _print_output();

    }

    // reset the text of code for the current line, the set of tones, and all the flags
    pr.reset_line = function() {
        pr.curr_line = "";
        pr.curr_token = [];
        _parensdepth = 0; // parens are always on the same line -- if the user enters an invalid note, we need to close these all out

        //reset flags
        _building_expression= false;
        _building_expression_childcommands = false;
        _building_int = false;
        _building_char = false;
        _building_float = false;

        _print_output(); // may be redundent
    }

    pr.reset_program = function() {
        pr.reset_line();
        _stackdepth = 0;
        root_display = document.getElementById("rootNote");
        root_display.innerText = "";
        pr.root_note = null;
        key = "C";
        _print_output();
    }

    pr.remove_last_note = function() {
        pr.reset_line();
        _print_output();
    }

    // format a string for the note
    pr.format_note = function(note) {
        return `${note.name} ${note.octave}`;
    }

    pr.update_root = function(new_root) {
        pr.root_note = new_root;
        root_display = document.getElementById("rootNote");
        root_display.innerText = new_root.name;
    }

    // if there's an error in the command, we print it, and reset the command, so the
    // programmer can try again
    _throw_error = function(msg) {
        pr.reset_line();
        if (msg == null || msg == "") {
            msg = "Could not determine command"; // default syntax error
        }
        throw(`SYNTAX ERROR : ${msg}`);
    }

    // add an expression to the current line and clear expression tones
    // does not clear flags, only the current word
    _add_exp = function(exp) {
        pr.curr_line += exp + " ";
        pr.curr_token = [];
        _print_output();
    }

    _interpret_digit = function(digit) {
        // check if we're at the end
        if (digit == 6 || digit == 7) { // if we've hit a Fifth
            if (_building_float) {
                _add_exp("."); // we're in a float, add decimal point
                _building_float = false;
                _building_int = true; // treat the rest as if we're building an int
            }
            else { 
                if (_building_char) _add_exp(")"); // closes out the tochar()

                // we're done with this number
                _building_char = false;
                _building_int = false;
            }
        } else {
            if (digit > 7) digit -= 2; // if higher than a Fifth, subtract offset
            pr.curr_line += digit; // add digit to number
        }
        _print_output();
    }

    _interpret_expression = function(note) {

        // in case we get to more than 3 chars -- this should never fire
        if (pr.curr_token.length > 3) {
            _throw_error("expression too long and not resolved");
        }

        if (pr.curr_token.length == 2) {
            switch(pr.curr_token[0]) {
                case 0: // root "value"
                    switch(pr.curr_token[1]) {
                        case 3:
                        case 4: // third "negative int"
                            _add_exp("-");
                            _building_int = true;
                            return;
                        case 5: // fourth "char"
                            _add_exp("String.fromCharCode(");
                            _building_char = true;
                            return;
                        case 6:
                        case 7: // fifth "positive int"
                            _building_int = true;
                            return;
                        case 8:
                        case 9: // sixth "positive double"
                            _building_float = true;
                            return;
                        case 10: // seventh "negative double"
                            _add_exp("-"); 
                            _building_float = true;
                            return;
                        // don't throw error, expression might be more than 2 letters
                    }
                    break;
                case 3:
                case 4: // third "conditional"
                    switch(pr.curr_token[1]) {
                        case 1:
                        case 2: // second "equality"
                            _add_exp("==");
                            return;
                        case 3:
                        case 4: // third "greater than"
                            _add_exp(">");
                            return;
                        case 5: // fourth "less than"
                            _add_exp("<");
                            return;
                        case 6:
                        case 7: // fifth "not"
                            _add_exp("!");
                            return;
                        case 8:
                        case 9: // sixth "and"
                            _add_exp("&&");
                            return;
                        case 10:
                        case 11: // seventh "or"
                            _add_exp("||");
                            return;
                    }
                    break;
                case 6:
                case 7: // Fifth, math
                    switch(pr.curr_token[1]) {
                        case 3:
                        case 4: // third "+"
                            _add_exp("+");
                            return;
                        case 1:
                        case 2: // second "-"
                            _add_exp("-");
                            return;
                        case 6:
                        case 7: // fifth "*"
                            _add_exp("*");
                            return;
                        case 5: // fourth "/"
                            _add_exp("/");
                            return;
                        case 8:
                        case 9: // sixth mod
                            _add_exp("%");
                            return;
                    }
                case 8:
                case 9: // sixth "procedural"
                    switch (pr.curr_token[1]) {
                        case 8:
                        case 9: // sixth "("
                            _add_exp("(");
                            _parensdepth++;
                            return;
                        case 1:
                        case 2: // second ")"
                            pr.curr_line += ")";
                            _parensdepth--; // closed a parentheses set
                            if (_parensdepth == 0) { // we're at the end of an expression

                                _building_expression = false; 

                                // if we are not in a block that is going straight from expression to command, add the closing semicolon
                                if (!_building_expression_childcommands) {
                                    pr.curr_line += ";";
                                    pr.complete_line(pr.curr_line);
                                } else {
                                    _building_expression_childcommands = false;
                                    pr.curr_line += " {";
                                    pr.complete_line(pr.curr_line);
                                    _stackdepth++;
                                }
                                return;
                            } // we're done with expression
                    }
            }
        }

        if (pr.curr_token.length == 3) {
            switch(pr.curr_token[0]) {
                case 0:
                    switch(pr.curr_token[1]) {
                        case 1:
                        case 2: // second "var"
                            _add_exp(pr.note_to_varname(note));
                            break;    
                    }
                    break;
                default: // we're three notes in and don't yet know what this is
                    _throw_error();
            }
        }        
    }

    _interpret_command = function(note) {

        console.log(`Root Note: ${pr.format_note(pr.root_note)}, Intervals: ${pr.curr_token}`);

        if (pr.curr_token.length == 1) {
            switch (pr.curr_token[0]) {
                case 1:
                case 2: // second "root note change"
                    pr.root_note = null; // will trigger reset of root_note
                    pr.complete_line("// changed root note");
                    break;
            }
        }

        if (pr.curr_token.length == 2) {
            switch(pr.curr_token[0]) {
                case 0: // unison / root / 1st "block"
                    switch(pr.curr_token[1]) {
                        case 1:
                        case 2: // second "while"
                            pr.curr_line = "while(";
                            _print_output();
                            _parensdepth++;
                            _building_expression_childcommands = true;
                            return;
                        case 3: 
                        case 4: // third "end block"
                            if (_stackdepth == 0) {
                                _print_output();
                                _throw_error("no block to close out of");
                            }
                            pr.complete_line("}");
                            _stackdepth--;
                            return;
                        case 6:
                        case 7: // fifth "if"
                            pr.curr_line = "if(";
                            _print_output();
                            _parensdepth++;
                            _building_expression_childcommands = true;
                            return;
                        case 8:
                        case 9: // sixth "else"
                            pr.complete_line("} else {");
                            return;
                    }
                    break;
                case 3:
                case 4: // third "let"
                    pr.curr_line += pr.note_to_varname(note) + " = (";
                    _print_output();
                    _parensdepth++;
                    _building_expression= true;
                    break;
                case 5: // fourth "declare"
                    pr.complete_line("var " + pr.note_to_varname(note) + ";");
                    break;

                case 8:
                case 9: // sixth "special commands"
                    switch(pr.curr_token[1]) {
                        case 6:
                        case 7: // fifth "print"
                            pr.curr_line = "print(";
                            _print_output();
                            _parensdepth++;
                            _building_expression= true;
                            return;
                    }
                    break;
                case 10:
                case 11: // seventh "undo last"
                    // this removes the last note but almost certainly doesn't work in a number of cases
                    pr.curr_token = pr.curr_token.slice(0, pr.curr_token.length-1);
                    return;
            }
        }

        // it takes three notes to end the program
        if (pr.curr_token.length == 3) {
            if (pr.curr_token[0] == 0 && pr.curr_token[1] == 0 && pr.curr_token[2] == 0) {
                pr.complete_line("// completed program");
                _print_output();
                return true; // program is complete
            }
        }

        if (pr.curr_token.length == 4) {
            switch(pr.curr_token[0]) {
                case 8:
                case 9: // sixth "special commands"
                    switch(pr.curr_token[1]) {
                        case 5: // fourth "input"
                            pr.complete_line(`${pr.note_to_varname(note)} = window.input();`);
                            return;
                        default:
                            _throw_error();
                    }
                    break;
                default: // if we've made it to four notes and don't have a resolution, it's an error
                    _throw_error();
            }
        }
    }

    // This is the main entry point -- given a note, it will update the current command
    // and, if the command is complete, add to the final program
    pr.add_tone = function(note) {
        if (pr.notelist.length == 0) {
            _throw_error("The note list needs to be set before calling pr.add_tone");
        }

        // check for root note first, as interval() will fail without it
        if (pr.root_note === null) { // we don't have a current root note
            pr.update_root(note);
            pr.reset_line(); // clear everything
            return;
        }

        pr.curr_token.push(pr.interval(pr.root_note, note));

        console.log("registering " + pr.format_note(note));
        if (pr.root_note != null)
            console.log("Root Note: " + pr.format_note(pr.root_note));

        // if we're building a number right now
        if (_building_int || _building_float || _building_char) {
            _interpret_digit(pr.curr_token[pr.curr_token.length - 1]);
            return;
        }

        // if we're in an expression or starting one
        if (_building_expression|| _building_expression_childcommands) {
            _interpret_expression(note);
            return;
        }

        // otherwise, we are in a command
        return _interpret_command(note);

    }    
    
})(velato.programbuilder)


