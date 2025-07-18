if (!velato) var velato = {};

if (typeof module !== 'undefined' && module.exports) { 
    const { start } = require('node:repl');
    const fs = require('node:fs'); // temporary, for testing

    velato.c = require('./velato_constants');
}

/*
 * A velato.note represents the note in several contexts:
 * * what was actually sounded to register this note
 * * the note as it is interpreted in raw form
 * * the note in context to a root note (in a key more or less)
 */
velato.note = function(name, octave, freq, index, actual_frequency) {

    // letter name of the note (with alternates when needed)
    // for notes with accidentals this includes BOTH equivalents (e.g. C# and Db)
     this.name = name;

    // which octave was sounded to create this note
    this.octave = octave;

    // the frequency for this note when it is sounded perfectly
    this.freq = freq;

    // the actual frequency sounded to register this note
    this.actual_frequency = actual_frequency;

    // its index in the frequencies.json list
    this.index = index;


    // Properties BELOW will all be determined when the root is set but start undefined:

    // root at the time the note is sounded
    this.root = undefined; 

    // interval in friendly name
    this.interval = undefined; 

    //  interval in number of semitones
    this.interval_semitones = undefined; 

    // as displayed to user -- notes with acidentals are interpreted as one or other
    this.displayname = undefined; 

    // as used by vexflow
    this.vexname = undefined;
    
    // as used in a variable name in the js program
    this.varname = undefined; 
 
    
    /* 
     * Fill out names in the note used in program-building
     */
    this.build_names = function() {
        
        this.displayname = velato.note.get_note_name(this.name, this.root);

        // drop by one octave for display
        this.vexname = `${this.displayname.replace("♯","#").replace("♭","@")}/${octave-1}`;

        let varname = this.name.replace("/", "").replace(" ","").replace("♯","s").replace("♭","b").replace(" ","_");
        this.varname = `var_${varname}`;

        if (this.root != undefined) {
            diff = (this.index - this.root.index) % 12;
            while (diff < 0) 
                diff += 12;
            diff = Math.abs(diff); // to remove -0

            this.interval_semitones = diff;

            this.interval = velato.c.INTERVALS[this.interval_semitones];
        }
    }
    
    this.set_root = function(new_root) {
        this.root = new_root;
        this.build_names(); // rebuild names in terms of the new root
    }

    this.with_octave = function() {
        // format a string for the note
        return `${this.displayname} ${this.octave}`;
    }
}

velato.note.DEFAULT_ACCIDENTALS = ["A♭","B♭","C♯","E♭","F♯"];

velato.note.SPECIAL_KEYS = {
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


/*
 * Returns the correct accidental for two equivalent tones
 * in terms of the root, or the default 
 * 
 * PARAMS
 * name = the name of a note (not the full note object)
 * root = full not object for root 
 */
velato.note._build_accidental = function(names, root) {

    acc = (names.length === 2); // passed note has an accidental

    if (acc) {
        flatv = names.find(x => x.includes("♭"));
        sharpv = names.find(x => x.includes("♯"));
    } else 
        var name = names[0];

    // if both root and passed note have accidentals
    if (acc) { 
        // if the note is the root
        if (root.name === flatv || root.name === sharpv) {
            return root;
        }
        // if the root is a flat, we also sound the flat
        if (root.name.includes("♭")) {
            return flatv;
        }
        // check if it's a "special" key whose minor is in flats and major not so
        if (root.name in velato.note.SPECIAL_KEYS) {
            specialkey = velato.note.SPECIAL_KEYS[root.name];
            if (flatv in specialkey.acc)
                return flatv;
            if (sharpv in specialkey.acc)
                return sharpv;
            if (specialkey.def == "♭")
                return flatv;
            return sharpv;
        }
        // otherwise, it's the sharp that wins
        return sharpv;
    }

    // e.g. B is sounded in key of B♭
    if (root.name.length == 2 && root.name.substring(0,1) == name) {
        return root.substring(0,1) + "♮";
    }

    // at the stage, only the naturals should be left, with no special treatment
    return name;
}
    
/*
 * Returns the correct name for a note, based on its root note
 * (essentially its key, but without knowing major vs minor)
 * 
 * PARAMS
 * name = the name of a note (not the full note object)
 * root = full note object for root 
 */
velato.note.get_note_name = function(name, root) {
    let names = name.split("/");
    names = names.map(e => e.trim());

    if (root == undefined)
    {
        if (name.includes("/")) {
            for(let i = 0; i < 2; i++) {
                const newNote = velato.note.DEFAULT_ACCIDENTALS.find(x => x == names[i]);
                if (newNote) {
                    return newNote;
                }
            }
        } 
        return name;
    }

    return velato.note._build_accidental(names, root);
}
    

if (typeof module !== 'undefined' && module.exports) {
    module.exports = velato.note;
}