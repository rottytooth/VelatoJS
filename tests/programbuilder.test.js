const { ProgramBuilder } = require('../src/velato_programbuilder');

if (!velato) var velato = {};

velato.c = require('../src/velato_constants');
velato.note = require('../src/velato_note');
velato.token = require('../src/velato_token');
velato.programbuilder = require('../src/velato_programbuilder').programbuilder;
velato.ObjPb = require('../src/velato_programbuilder').ObjPb;
velato.web_display = require('./velato_tester_display');

get_note = require('./note_builder');
// beforeEach(() => {
//     jest.clearAllMocks();
// });



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

test('first note prints comment correctly', () => {
    let output = "";
    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };    

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = '';

    pb.add_tone(get_note("C",6));
    root_note = pb.root_note;
    expect(output).toContain("<span class='cmt'>// set root note to C</span>")
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

    velato.web_display.write_full_callback = (full_program, js_program) => {
        full_program = full_program;
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

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
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

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
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

test('Let: command only', () => {

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    velato.web_display.write_notes_callback = (final_program, commands) => {
        final_version = commands[0].name;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("C♯ / D♭",6));

    expect(final_version).toBeDefined();
    expect(final_version).toBe("Let");
});

test('While: command only', () => {

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    velato.web_display.write_notes_callback = (final_program, commands) => {
        final_version = commands[0].name;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6));

    expect(final_version).toBeDefined();
    expect(final_version).toBe("While");
});

test('EndBlock: command only', () => {

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    velato.web_display.write_notes_callback = (final_program, commands) => {
        final_version = commands[0].name;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("G",6));
    pb.add_tone(get_note("G",6));
    pb.add_tone(get_note("B",6));

    expect(final_version).toBeDefined();
    expect(final_version).toBe("EndBlock");
});

test('Print: command only', () => {

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    velato.web_display.write_notes_callback = (final_program, commands) => {
        final_version = commands[0].name;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("G",6));

    expect(final_version).toBeDefined();
    expect(final_version).toBe("Print");
});

/* Tests with Expressions */

test('Var: prints with correct varname, accidental', () => {

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("C♯ / D♭",6)); // should be variable to store value in

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6)); // PositiveInt

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("E",6)); // End of PositiveInt

    let final_cmd = full_program[full_program.length - 1];

    expect(final_cmd).toBeDefined();
    expect(final_cmd.children.length).toBe(2);
    expect(final_cmd.children[0].type).toBe("Tone");

    // assigned to the correct variable
    let fc_str = final_cmd.print();
    expect(fc_str).toContain("class='var'");
    expect(fc_str).toContain("var_Cs_Db");
});

test('Let: assign PositiveInt', () => {

    let full_program = [];

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("C♯ / D♭",6)); // should be variable to store value in

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6)); // PositiveInt

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("E",6)); // End of PositiveInt

    let final_cmd = full_program[full_program.length - 1];

    expect(final_cmd).toBeDefined();
    expect(final_cmd.children.length).toBe(2);
    expect(final_cmd.children[0].type).toBe("Tone");

    // assigned to the correct variable
    expect(final_cmd.children[0].sequence).toStrictEqual(['var_Cs_Db']);

    expect(final_cmd.children[1].type).toBe("Exp");
});

test('Print: variable', () => {

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("G",6)); // Print

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("D",6)); // Var

    pb.add_tone(get_note("E",6)); // Variable Name

    let final_cmd = full_program[full_program.length - 1];

    expect(final_cmd).toBeDefined();
    expect(final_cmd.name).toBe("Print");
});

test('Print: variable with assigned variable name', () => {

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("F♯ / G♭",6));
    pb.add_tone(get_note("E",6)); // Print

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6)); // Var

    pb.add_tone(get_note("E",6)); // Variable Name

    final_cmd = full_program[full_program.length - 1];

    expect(final_cmd).toBeDefined();
    expect(final_cmd.name).toBe("Print");

    expect(final_cmd.children[0].children[0].type).toBe("Tone");

    // assigned to the correct variable
    let fc_str = final_cmd.print();
    // expect(fc_str).toContain("class='var'");
    expect(fc_str).toContain("print(");
    expect(fc_str).toContain("var_E");
});

test('Let: assign PositiveInt: Prints Correctly', () => {

    let full_program = [];

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("C♯ / D♭",6)); // should be variable to store value in

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6)); // PositiveInt

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("E",6)); // End of PositiveInt

    let final_cmd = full_program[full_program.length - 1];

    // assigned to the correct variable
    let fc_str = final_cmd.print();
    expect(fc_str).toContain("class='var'");
    expect(fc_str).toContain("var_Cs_Db");
    expect(fc_str).toContain("3");
});