if (!velato) var velato = {};

velato.c = require('../src/velato_constants');
velato.note = require('../src/velato_note');
velato.token = require('../src/velato_token');

// use the real web display
velato.web_display = require('../src/velato_web_display');

velato.ObjPb = require('../src/velato_programbuilder').ObjPb;


get_note = require('./note_builder');


beforeEach(() => {
    jest.clearAllMocks();
});


test('vextab: single note command', () => {
    let cmds = [];
    velato.web_display.write_notes_callback = (final_program, commands) => {
        cmds = commands;
    };

    let pb = new velato.ObjPb(true);
    pb.BEG_PROGRAM = '';

    pb.add_tone(get_note("C",6));
    expect(cmds.length).toBe(1); // only one command

    let vex_out = velato.web_display.build_vextab(cmds);

    expect(vex_out).toContain("notes C/5 $C$");
    expect(vex_out).toContain(",Set Root\n"); // Set Root Note alone
});

test('vextab: Change Root command with param', () => {
    let cmds = [];
    velato.web_display.write_notes_callback = (final_program, commands) => {
        cmds = commands;
    };

    let pb = new velato.ObjPb(true);
    pb.BEG_PROGRAM = '';

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("D",6));
    pb.add_tone(get_note("E",6));
    expect(cmds.length).toBe(2);

    let vex_out = velato.web_display.build_vextab(cmds);

    expect(vex_out).toContain("notes C/5 $C$");
    expect(vex_out).toContain(",Set Root\n"); // Set Root Note alone
    expect(vex_out).toContain("text Set Root, E");
});

test('vextab: Let with value', () => {
    let cmds = [];
    velato.web_display.write_notes_callback = (final_program, commands) => {
        cmds = commands;
    };

    let pb = new velato.ObjPb(true);
    pb.BEG_PROGRAM = '';

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("E",6)); // variable E
    pb.add_tone(get_note("C",6)); // value
    pb.add_tone(get_note("G",6)); // positive int
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("G",6)); // end of int

    expect(cmds.length).toBe(2);

    let vex_out = velato.web_display.build_vextab(cmds);

    expect(vex_out).toContain(",Set Root\n"); // Set Root Note alone
    expect(vex_out.replace(/\s/g, "")).toContain("Let, var_E, int, ,444".replace(/\s/g, "")); 
});

test('vextab: Let with variable', () => {
    let cmds = [];
    velato.web_display.write_notes_callback = (final_program, commands) => {
        cmds = commands;
    };

    let pb = new velato.ObjPb(true);
    pb.BEG_PROGRAM = '';

    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("D♯ / E♭",6));
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("B",5));
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("D♯ / E♭",6));

    expect(cmds.length).toBe(2);

    let vex_out = velato.web_display.build_vextab(cmds);

    expect(vex_out).toContain(",Set Root\n"); // Set Root Note alone
    expect(vex_out.replace(/\s/g, "")).toContain("text Let, var_B, Variable, ,  var_Ds_Eb".replace(/\s/g, ""));
});

test('vextab: addition', () => {
    let cmds = [];
    velato.web_display.write_notes_callback = (final_program, commands) => {
        cmds = commands;
    };

    let pb = new velato.ObjPb(true);
    pb.BEG_PROGRAM = '';

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("E",6)); // variable E

    pb.add_tone(get_note("G",6)); // 
    pb.add_tone(get_note("E",6)); // plus

    pb.add_tone(get_note("C",6)); // value
    pb.add_tone(get_note("G",6)); // positive int
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("G",6)); // end of int

    pb.add_tone(get_note("C",6)); // value
    pb.add_tone(get_note("G",6)); // positive int
    pb.add_tone(get_note("D",6)); // digit
    pb.add_tone(get_note("F",6)); // digit
    pb.add_tone(get_note("A",6)); // digit
    pb.add_tone(get_note("G",6)); // end of int

    expect(cmds.length).toBe(2);

    let vex_out = velato.web_display.build_vextab(cmds);

    expect(vex_out).toContain(",Set Root\n"); // Set Root Note alone
    expect(vex_out.replace(/\s/g, "")).toContain("var_E, +, , int, ,  444, , , , int, ,  257".replace(/\s/g, ""));
});