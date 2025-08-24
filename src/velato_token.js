if (!velato) var velato = {};

/*
 * A velato.token is the basic parsing unit of the language
 *
 * From a series of these tokens, one should be able to determine:
 * * the entire program as a series of notes
 * * the entire program as js commands
 */
velato.token = function(lex) {

    this._lexicon = lex;

    this.notes = []; // set of velato.notes for the token -- the actual lexeme

    this.sequence = []; // notes, as strings, for the note sequence -- populated first

    this._print = ""; // print before children

    this._print_staff = ""; // print for vextab 

    this.lexpath = undefined; // this will hold the path to the definition of the token

    this.children = []; // child nodes of any type except Cmds (Tone, Exp etc)

    this.resolved = false;

    this.indent = 0; // how many blocks it is in


    this.setlexpath = function(l) {
        this.lexpath = l; // the node in lexicon.json that this token is identified as

        let val = l.reduce((o, n) => o[n], this._lexicon);
        this.is_defined = true;

        this.type = val.token_type;

        this.name = val.name;
        this.desc = val.desc;
        this._print = val.print;
        this._print_staff = val.print_staff;
        this.notedesc = val.notedesc;
        this.childCmds = val.childCmds;

        if (this.type == "Cmd") {
            this.resolved = true;
        }

        // we should store the expected children here, to then fill with subsequent notes
        if (val.children !== undefined) {
            for (let i = 0; i < val.children.length; i++) {
                let new_child = new velato.token(this._lexicon);

                // build out the lexpath as the current node's lexpath plus what is needed to match
                // where the child node falls in the lexicon
                // e.g. ["Cmds", "Tone"] becomes ["Cmds", "Tone", "children", "0"]
                child_lexpath = this.lexpath.map((x) => x);
                child_lexpath.push("children");
                child_lexpath.push(i);

                new_child.setlexpath(child_lexpath);
                this.children.push(new_child);
            }
        }
    }

    this.add_note = function(note) {
        this.notes.push(note);
    }

    this.print = function(staff) {
        if (this.type == "Cmd" && !staff)
            for(let i = 0; i < this.indent;i++)
                printStr += "\t";

        let printStr = (staff ? 
            this._print_staff || "" : 
            this._print || "");        

        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];
            printStr = printStr.replace(`{exp}`, child.print(staff));
        }
        if (this.notes.length > 0 && this.notes[0].name)
            printStr = printStr.replace("{notename}", this.notes[0].name);
        printStr = printStr.replace("{varname}", this.sequence[0]);
        printStr = printStr.replace("{seq_int}", parseInt(this.sequence.join(""), 10).toString());
        printStr = printStr.replace("{seq_char}", String.fromCharCode(...this.sequence));

        return printStr;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = velato.token;
}