
window.velato = window.velato || {}

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

    this.sequence = []; // used for numerics or chars

    this._print = ""; // print before children
    this._postprint = ""; // print after children

    this.lexpath = undefined; // this will hold the path to the definition of the token

    this.children = []; // child nodes of any type except Cmds (Tone, Exp etc)

    this.resolved = false;

    this.indent = 0; // how many blocks it is in


    this.setlexpath = function(lexpath) {
        this.lexpath = lexpath; // the node in lexicon.json that this token is identified as

        let l = this._lexicon;
        let val = this.lexpath.reduce((o, n) => o[n], l);
        this.is_defined = true;

        this.type = val.token_type;

        this.name = val.name;
        this.desc = val.desc;
        this._print = val.print;
        this._postprint = val.postprint;
        this.notedesc = val.notedesc;
        this.childCmds = val.childCmds;

        if (this.type == "Cmd") {
            this.resolved = true;
        }

        // child nodes are their own copy, to track if they are complete
        if (val.children !== undefined) {
            for (let i = 0; i < val.children.length; i++) {
                let new_child = new velato.token(this._lexicon);
                child_lexpath = this.lexpath.map((x) => x); // clone
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

    this.print = function(retstr) {
        if (retstr === undefined) retstr = "";

        if (this.type == "Cmd")
            for(let i = 0; i < this.indent;i++)
                retstr += "\t";

        if (this._print !== undefined) // this can happen if lexicon.json is lacking it
            retstr += this._print.replace("{varname}", this.sequence[0])
                .replace("{seq_int}", this.sequence.join())
                .replace("{seq_char}", String.fromCharCode(this.sequence.join()));

            // recursively go through children (but not child commands) and print
        for(let i = 0; i < this.children.length;i++) {
            retstr += this.children[i].print();
        }

        if (this._postprint !== undefined)
            retstr += this._postprint;

        return retstr;
    }
}

