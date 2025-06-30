if (!velato) var velato = {};

velato.c = require('../velato_constants');
velato.note = require('../velato_note');
velato.token = require('../velato_token');
velato.programbuilder = require('../velato_programbuilder');

//beforeEach(() => jest.restoreAllMocks());

test('programbuilder starts up', () => {
    root_note = velato.programbuilder.root_note;
});

test('no root note on startup', () => {
    root_note = velato.programbuilder.root_note;
    expect(root_note).toBeDefined();
    expect(root_note).toBeNull();
});