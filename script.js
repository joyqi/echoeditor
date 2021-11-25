const $ = (sel) => document.querySelector(sel);
const config = loadConfig();
const editor = $('#editor');

function makeStyle(color) {
    let match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return 'rgba(' + (parseInt(match[1], 16)) + ',' + (parseInt(match[2], 16)) 
        + ',' + (parseInt(match[3], 16)) + ',' + 0.5 + ')';
}

function loadConfig() {
    const defaultConfig = {
        fontSize: 16,
        textColor: '#000000',
        backgroundColor: '#FFFFFF'
    };

    const config = localStorage.getItem('config');
    return Object.assign(defaultConfig, config ? JSON.parse(config) : {});
}

function saveConfig(config) {
    localStorage.setItem('config', JSON.stringify(config));
}

function applyConfig(sel, column, cb) {
    const input = $(sel);
    input.value = config[column];
    cb(config[column]);

    input.addEventListener('input', function() {
        cb(this.value);
        config[column] = this.value;
        saveConfig(config);
    });
}

function play(audio) {
    $('#audio-' + audio).play();
}

function editorHandler() {
    editor.textContent = localStorage.getItem('draft');

    editor.addEventListener('input', function() {
        localStorage.setItem('draft', this.textContent);
    });

    editor.addEventListener('keypress', (e) => {
        play('click');
    });
}


applyConfig('#font-size', 'fontSize', (fontSize) => {
    editor.style.fontSize = fontSize + 'px';
});

applyConfig('#text-color', 'textColor', (color) => {
    editor.style.color = color;
    editor.style.borderColor = makeStyle(color);
});

applyConfig('#background-color', 'backgroundColor', (color) => {
    document.body.style.backgroundColor = color;
});

editorHandler();