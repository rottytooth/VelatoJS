
window.velato = window.velato || {}

/*
 * A velato.token is the basic parsing unit of the language
 *
 * From a series of these tokens, one should be able to determine:
 * * the entire program as a series of notes
 * * the entire program as js commands
 */
velato.token = function() {

    this.notes = []; // set of velato.notes for the token

    this.sequence = []; // used for numerics or chars

    this._print = undefined;

    this.lexnode = undefined; // the node in lexicon.json that this token is identified as

    this.add_note = function(note) {
        this.notes.push(note);
    }

    this.setlex = function(node) {
        this.lexnode = structuredClone(node);
        this.type = node.type;
        this.name = node.name;
        this.desc = node.desc;
        this._print = node.print;
        this.childCmds = node.childCmds;

        this.children = structuredClone(node.children);
    }

    // called to produce js text from notes
    this.evaluate = function() {
        if (!this._print)
            return "";

        return this._print
            .replace("{varname}", this.sequence[0]) // this should already be set to a variable name in this case
            .replace("{seq_int}", this.sequence.join())
            .replace("{seq_char}", String.fromCharCode(this.sequence.join()));
    }

    // this.clone = function() {
    //     clone = new velato.token();
    //     clone.notes = this.notes.slice(0); // copy array
    //     clone.sequence = this.sequence.slice(0);
    //     clone._print = this._print;
    //     return clone;
    // }
}

