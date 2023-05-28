
window.velato = window.velato || {}

/*
 * A velato.token is the basic parsing unit of the language
 */
velato.token = function() {

    this.notes = []; // set of velato.notes for the token

    this.js = ''; // program text corresponding to this token

    this.newline = false; // text should end with a newline

    this.add_note = function(note) {
        this.notes.push(note);
    }

    // called to produce js text from notes
    this.evaluate = function() {
    }
}

