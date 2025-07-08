const { ProgramBuilder } = require('../velato_programbuilder');

if (!velato) var velato = {};

velato.c = require('../velato_constants');
velato.note = require('../velato_note');
velato.token = require('../velato_token');
velato.programbuilder = require('../velato_programbuilder').programbuilder;
velato.ObjPb = require('../velato_programbuilder').ObjPb;
velato.web_display = require('./velato_tester_display');

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
    // velato.programbuilder.reset_program(); // must reset first, as these functions overlap    

    velato.programbuilder.add_tone(new velato.note("C",4,null,null,null));
    root_note = velato.programbuilder.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("C");
});

test('first note sets root note: B', async () => {
    // velato.programbuilder.reset_program(); // must reset first, as these functions overlap
    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = '';

    pb.add_tone(new velato.note("B",4,null,null,null));
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

    pb.add_tone(new velato.note("C",4,null,null,null));
    pb.add_tone(new velato.note("D",4,null,null,null));
    pb.add_tone(new velato.note("E",4,null,null,null));

    root_note = pb.root_note;
    expect(root_note).toBeDefined();
    expect(root_note.name).toBe("E");
    //FIXME: Something is not right with lexpath
});

