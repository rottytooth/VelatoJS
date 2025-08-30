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

    let full_program = [];

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("G",6));
    pb.add_tone(get_note("G",6));
    pb.add_tone(get_note("B",6));

    expect(full_program[1]).toBeDefined();
    expect(full_program[1].name).toBe("EndBlock");
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
    expect(fc_str).toContain("console.log(");
    expect(fc_str).toContain("var_E");
});

test('Let: assign PositiveInt: has correct value', () => {
    let full_program = [];

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
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

    let final_cmd = full_program[full_program.length - 1];

    // assigned to the correct variable
    let fc_str = final_cmd.print();
    expect(fc_str).toContain("class='var'");
    expect(fc_str.replace(/\s/g, "")).toContain("= 444;".replace(/\s/g, ""));
});

test('Let: assign PositiveInt: prints correctly', () => {

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

test('Let: assign PositiveInt: prints correctly 2', () => {

    let full_program = [];

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("F",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("F",6));
    pb.add_tone(get_note("G♯ / A♭",6));
    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("C",6));

    let final_cmd = full_program[full_program.length - 1];

    // assigned to the correct variable
    let fc_str = final_cmd.print();
    expect(fc_str).toContain("class='var'");
    expect(fc_str).toContain("var_As_Bb");
    expect(fc_str).toContain("-5");
});

test('Let: comparison', () => {
    let full_program = [];
    let final_cmds = [];

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    velato.web_display.write_notes_callback = (final_program, commands) => {
        final_cmds = commands;
    };

    pb = new velato.ObjPb();
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

    let final_cmd = full_program[full_program.length - 1];

    // assigned to the correct variable
    let fc_str = final_cmd.print();
    expect(fc_str).toContain("class='var'");
    expect(fc_str.replace(/\s/g, "")).toContain("=(444 + 257);".replace(/\s/g, ""));
});

test('Let: compound arithmetic expression', () => {
    let full_program = [];
    let final_cmds = [];

    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    velato.web_display.write_notes_callback = (final_program, commands) => {
        final_cmds = commands;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    pb.add_tone(get_note("C",6));
    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("E",6)); // variable E

    pb.add_tone(get_note("G",6)); // 
    pb.add_tone(get_note("G",6)); // times

    pb.add_tone(get_note("G",6)); // 
    pb.add_tone(get_note("E",6)); // plus

    pb.add_tone(get_note("C",6)); // value
    pb.add_tone(get_note("G",6)); // positive int
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("G",6)); // end of int

    pb.add_tone(get_note("C",6)); // value
    pb.add_tone(get_note("G",6)); // positive int
    pb.add_tone(get_note("D",6)); // digit
    pb.add_tone(get_note("F",6)); // digit
    pb.add_tone(get_note("E",6)); // digit
    pb.add_tone(get_note("G",6)); // end of int

    pb.add_tone(get_note("G",6)); // 
    pb.add_tone(get_note("A",6)); // mod

    pb.add_tone(get_note("C",6)); // value
    pb.add_tone(get_note("G",6)); // positive int
    pb.add_tone(get_note("D",6)); // digit
    pb.add_tone(get_note("F",6)); // digit
    pb.add_tone(get_note("A",6)); // digit
    pb.add_tone(get_note("G",6)); // end of int

    pb.add_tone(get_note("C",6)); // value
    pb.add_tone(get_note("E",6)); // negative int
    pb.add_tone(get_note("D",6)); // digit
    pb.add_tone(get_note("F",6)); // digit
    pb.add_tone(get_note("A",6)); // digit
    pb.add_tone(get_note("G",6)); // end of int

    let final_cmd = full_program[full_program.length - 1];

    // assigned to the correct variable
    let fc_str = final_cmd.print();
    expect(fc_str).toContain("class='var'");
    expect(fc_str.replace(/\s/g, "")).toContain("= (( 44 +  254) * ( 257 %  -257));".replace(/\s/g, ""));
});

test('Fibonacci Program', () => {
    let full_program = [];
    let commands = [];
    
    // write the whole program as it is
    velato.web_display.write_full_callback = (fp, js) => {
        full_program = fp;
        output = js;
    };

    pb = new velato.ObjPb();
    pb.BEG_PROGRAM = ''; 

    // set root 
    pb.add_tone(get_note("A",6));

    // let var_c# = 0
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6));

    expect(full_program[1].print().replace(/\s/g, "")).toContain("var_Cs_Db</span> = 0;".replace(/\s/g, ""));

    // let var_f# = 1
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("F♯ / G♭",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("E",6));

    expect(full_program[2].print().replace(/\s/g, "")).toContain("var_Fs_Gb</span> = 1;".replace(/\s/g, ""));

    // let var_g# = 1 
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("G♯ / A♭",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("E",6));

    expect(full_program[3].print().replace(/\s/g, "")).toContain("var_Gs_Ab</span> = 1;".replace(/\s/g, ""));

    // while (var_g# < 11) {
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6)); // while

    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("D",6)); // <

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("G♯ / A♭",6)); // var g#

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6)); // PositiveInt

    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("E",6)); // 11

    expect(full_program[4].print().replace(/\s/g, "")).toContain("while</span> ((<span class='var'> var_Gs_Ab</span> &lt;  11)) {".replace(/\s/g, ""));

    // print(var_c#)
    pb.add_tone(get_note("F♯ / G♭",6));
    pb.add_tone(get_note("E",6)); // print

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("C♯ / D♭",6)); // var_c

    expect(full_program[5].print().replace(/\s/g, "")).toContain("console.log(<span class='var'> var_Cs_Db</span>);".replace(/\s/g, ""));

    // print \n
    pb.add_tone(get_note("F♯ / G♭",6));
    pb.add_tone(get_note("E",6)); // print

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("D",6)); //char

    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6)); // 10

    expect(full_program[6].print().replace(/\s/g, "")).toContain("console.log(String.fromCharCode(10))".replace(/\s/g, ""));

    // let var_d = var_c# + var_f#
    pb.add_tone(get_note("C♯ / D♭",6)); // let
    pb.add_tone(get_note("D",6)); // var_d

    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("C♯ / D♭",6)); // +

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("C♯ / D♭",6)); // var_c#

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("F♯ / G♭",6)); // var_f#

    expect(full_program[7].print().replace(/\s/g, "")).toContain("<span class='var'>var_D</span> = (<span class='var'> var_Cs_Db</span> + <span class='var'> var_Fs_Gb</span>)".replace(/\s/g, ""));

    // let var_c# = var_f#
    pb.add_tone(get_note("C♯ / D♭",6)); // let
    pb.add_tone(get_note("C♯ / D♭",6)); // var_c#

    pb.add_tone(get_note("A",6)); 
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("F♯ / G♭",6)); // var_f#

    expect(full_program[8].print().replace(/\s/g, "")).toContain("var_Cs_Db</span> = <span class='var'> var_Fs_Gb</span>".replace(/\s/g, ""));

    // let var_f# = var_d
    pb.add_tone(get_note("C♯ / D♭",6)); // let
    pb.add_tone(get_note("F♯ / G♭",6)); // var_f#

    pb.add_tone(get_note("A",6)); 
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("D",6)); // var_d

    expect(full_program[9].print().replace(/\s/g, "")).toContain("var_Fs_Gb</span> = <span class='var'> var_D</span>".replace(/\s/g, ""));

    // let var_g# = var_g# + 1
    pb.add_tone(get_note("C♯ / D♭",6));
    pb.add_tone(get_note("G♯ / A♭",6)); // var g#

    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("C♯ / D♭",6)); // +

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("B",6));
    pb.add_tone(get_note("G♯ / A♭",6)); // var g#

    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("E",6));
    pb.add_tone(get_note("A♯ / B♭",6));
    pb.add_tone(get_note("E",6)); // 1

    expect(full_program[10].print().replace(/\s/g, "")).toContain("<span class='var'>var_Gs_Ab</span> = (<span class='var'> var_Gs_Ab</span> + 1);".replace(/\s/g, ""));

    // } (end while)
    pb.add_tone(get_note("A",6));
    pb.add_tone(get_note("C♯ / D♭",6));    

    expect(full_program[11].print().replace(/\s/g, "")).toContain("}".replace(/\s/g, ""));

    for (let i = 0; i < full_program.length; i++) {
        console.log(full_program[i].print());
    }
});