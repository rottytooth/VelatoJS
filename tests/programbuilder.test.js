if (!velato) var velato = {};

velato.c = require('../velato_constants');
velato.note = require('../velato_note');
velato.token = require('../velato_token');
velato.programbuilder = require('../velato_programbuilder');

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

test('programbuilder starts up', () => {
    root_note = velato.programbuilder.root_note;
});

test('no root note on startup', () => {
    root_note = velato.programbuilder.root_note;
    expect(root_note).toBeDefined();
    expect(root_note).toBeNull();
});

test('first note sets root note: C', () => {
    let note = new velato.note("C",4,null,null,null);
    velato.programbuilder.reset_program(); // must reset first, as these functions overlap    
    velato.programbuilder.add_tone(note);
    root_note = velato.programbuilder.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("C");
});

test('first note sets root note: B', () => {
    let note = new velato.note("B",4,null,null,null);
    velato.programbuilder.reset_program(); // must reset first, as these functions overlap
    velato.programbuilder.add_tone(note);
    root_note = velato.programbuilder.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("B");
});


