// this is used in place of vealto_web_display.js but for node
// (meaning for jest testing) only

if (!velato) var velato = {};

if (typeof module !== 'undefined' && module.exports) { 
    const { start } = require('node:repl');
    const fs = require('node:fs'); // temporary, for testing

    velato.c = require('./velato_constants');
}

velato.web_display = (function() {
    // Responsible for all user feedback and display of the program

        /*
     * Writes notes to the screen as a png
     * 
     * PARAMS
     * final_program = write to current command or final program?
     * stack = an array of velato.token command objects
     */
    const write_notes = (final_program, commands) => {

        if (commands.length == 0) return; 

        if (commands.length == 1 && commands[0].print().length == 0) return;

        // do some reporting of what was sent
    }

    const clear_curr_command = () => {
    }

    var write_full_callback = undefined;

    const feedback = (desc, exp) => {
        console.log("Feedback: " + desc);
    }

    const clear_feedback = () => { }

    const reset_display = () => {}

    const write_full_program = (js_program) => {
        if (write_full_callback) write_full_callback(js_program);
    }

    return {
        write_notes: write_notes,
        clear_curr_command: clear_curr_command,
        write_full_program: write_full_program,
        feedback: feedback,
        clear_feedback: clear_feedback,
        reset_display: reset_display
    }
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = velato.web_display;
}
