const { ProgramBuilder } = require('../src/velato_programbuilder');

if (!velato) var velato = {};

velato.c = require('../src/velato_constants');
velato.note = require('../src/velato_note');
velato.token = require('../src/velato_token');
velato.programbuilder = require('../src/velato_programbuilder').programbuilder;
velato.ObjPb = require('../src/velato_programbuilder').ObjPb;
velato.web_display = require('./velato_tester_display');

// beforeEach(() => {
//     jest.clearAllMocks();
// });

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

test('programbuilder starts up', () => {
    root_note = velato.programbuilder.root_note;
});

test('no root note on startup', () => {
    root_note = velato.programbuilder.root_note;
    expect(root_note).toBeDefined();
    expect(root_note).toBeNull();
});

test('first note sets root note: C', () => {
    // velato.programbuilder.reset_program(); // must reset first, as these functions overlap    

    velato.programbuilder.add_tone(get_note("C",6));
    root_note = velato.programbuilder.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("C");
});

test('first note sets root note: B', () => {
    // velato.programbuilder.reset_program(); // must reset first, as these functions overlap
    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = '';

    pb.add_tone(get_note("B",5));
    root_note = pb.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("B");
});

test('change root note', () => {

    velato.web_display.write_full_callback = (js_program) => {
        output = js_program;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("D",6));
    pb.add_tone(get_note("E",6));

    root_note = pb.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("E");
});

test('change root note to accidental', () => {

    velato.web_display.write_full_callback = (js_program) => {
        output = js_program;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("B",5));
    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("C♯ / D♭",6));

    root_note = pb.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("C♯ / D♭");
});

test('reset: first following note sets root', () => {

    velato.web_display.write_full_callback = (js_program) => {
        output = js_program;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("B",5));
    pb.reset_program();
    pb.add_tone(get_note("C♯ / D♭",6));

    root_note = pb.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("C♯ / D♭");
});
