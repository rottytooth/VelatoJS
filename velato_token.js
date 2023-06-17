
window.velato = window.velato || {}

/*
 * A velato.token is the basic parsing unit of the language
 */
velato.token = function() {

    this.notes = []; // set of velato.notes for the token

    this.sequence = []; // used for numerics or chars

    this.print = undefined;

    this.add_note = function(note) {
        this.notes.push(note);
    }

    // called to produce js text from notes
    this.evaluate = function() {
        if (!this.print)
            return "";

        return this.print
            .replace("{varname}", this.sequence[0]) // this should already be set to a variable name in this case
            .replace("{seq_int}", this.sequence.join())
            .replace("{seq_char}", String.fromCharCode(this.sequence.join()));
    }

    this.clone = function() {
        clone = new velato.token();
        clone.notes = this.notes.slice(0); // copy array
        clone.sequence = this.sequence;
        clone.print = this.print;
        return clone;
    }
}

