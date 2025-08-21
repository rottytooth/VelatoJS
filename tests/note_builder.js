if (!velato) var velato = {};
velato.c = require('../src/velato_constants');
velato.note = require('../src/velato_note');

const get_note = (name, octave) => {
    // Mocks how intervals are assigned in velato_audio_interface
    // The interval numbers are used to calculate distance, and so must be populated correctly.
    switch (name) {
        case "B":
            if (octave == 5)
                return new velato.note("B", octave, null, 71, null);
            else if (octave == 6)
                return new velato.note("B", octave, null, 83, null);
        case "C":
            if (octave == 6)
                return new velato.note("C", octave, null, 72, null);
        case "C♯ / D♭":
            if (octave == 6)
                return new velato.note("C♯ / D♭", octave, null, 73, null);
        case "D":
            if (octave == 6)
                return new velato.note("D", octave, null, 74, null);
        case "D♯ / E♭":
            if (octave == 6)
                return new velato.note("D♯ / E♭", octave, null, 75, null);
        case "E":
            if (octave == 6)
                return new velato.note("E", octave, null, 76, null);
        case "F":
            if (octave == 6)
                return new velato.note("F", octave, null, 77, null);
        case "F♯ / G♭":
            if (octave == 6)
                return new velato.note("F♯ / G♭", octave, null, 78, null);
        case "G":
            if (octave == 6)
                return new velato.note("G", octave, null, 79, null);
        case "G♯ / A♭":
            if (octave == 6)
                return new velato.note("G♯ / A♭", octave, null, 80, null);
        case "A":
            if (octave == 6)
                return new velato.note("A", octave, null, 81, null);
        case "A♯ / B♭":
            if (octave == 6)
                return new velato.note("A♯ / B♭", octave, null, 82, null);
        default:
            throw new Error(`Unknown note: ${name} ${octave}`);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = get_note;
}