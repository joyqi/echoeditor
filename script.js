const $ = (sel) => document.querySelector(sel);
const config = loadConfig();
const editor = $('#editor');
const wordCount = $('#word-count');
let keySoundAudio = null;

function makeStyle(color) {
    let match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return 'rgba(' + (parseInt(match[1], 16)) + ',' + (parseInt(match[2], 16)) 
        + ',' + (parseInt(match[3], 16)) + ',' + 0.5 + ')';
}

function countWord(text) {
    const count = text.length - (text.match(/\s/g) || []).length;
    wordCount.textContent = count;
}

function loadConfig() {
    const defaultConfig = {
        fontFamily: 'sans-serif',
        fontSize: 16,
        textColor: '#000000',
        backgroundColor: '#FFFFFF',
        keySound: 'none'
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

function playKeySound() {
    if (keySoundAudio) {
        keySoundAudio.play();
    }
}

function editorHandler() {
    editor.textContent = localStorage.getItem('draft');
    countWord(editor.textContent);

    editor.addEventListener('input', function() {
        localStorage.setItem('draft', this.textContent);
        countWord(this.textContent);
    });

    editor.addEventListener('keypress', (e) => {
        playKeySound();
    });
}

applyConfig('#font-family', 'fontFamily', (fontFamily) => {
    editor.style.fontFamily = fontFamily;
    wordCount.style.fontFamily = fontFamily;
});

applyConfig('#font-size', 'fontSize', (fontSize) => {
    editor.style.fontSize = fontSize + 'px';
    wordCount.style.fontSize = fontSize + 'px';
});

applyConfig('#text-color', 'textColor', (color) => {
    editor.style.color = color;

    alphaColor = makeStyle(color);
    editor.style.borderColor = alphaColor;
    wordCount.style.color = alphaColor;
});

applyConfig('#background-color', 'backgroundColor', (color) => {
    document.body.style.backgroundColor = color;
});

applyConfig('#key-sound', 'keySound', (keySound) => {
    if (keySoundAudio) {
        document.body.removeChild(keySoundAudio);
    }

    if (keySound == 'none') {
        keySoundAudio = null;
    } else {
        keySoundAudio = document.createElement('audio');
        source = document.createElement('source');
        source.src = './audio/' + keySound + '.wav';
        keySoundAudio.appendChild(source);
        document.body.appendChild(keySoundAudio);
    }
});

editorHandler();