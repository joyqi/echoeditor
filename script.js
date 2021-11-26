const $ = (sel) => document.querySelector(sel);
const config = loadConfig();
const editor = $('#editor');
const wordCount = $('#word-count');
let keySoundAudio = null;

function makeStyle(color, alpha) {
    let match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return 'rgba(' + (parseInt(match[1], 16)) + ',' + (parseInt(match[2], 16)) 
        + ',' + (parseInt(match[3], 16)) + ',' + alpha + ')';
}

function textHandler(text) {
    // count word
    const count = text.length - (text.match(/\s/g) || []).length;
    wordCount.textContent = count;

    // read title
    const matches = text.match(/\s*([\S ]+)/);
    let title = matches ? matches[1] : '...';

    if (title.length > 20) {
        title = title.substring(0, 20) + '...';
    }

    document.title = title;
}

function isTypingText(e) {
    if (e.isComposing) {
        return false;
    }

    if (e.code.match(/^(Key[a-z]|Digit[0-9]|Enter|Space|Backspace)$/i)) {
        return true;
    }

    if (e.code.match(/^(Backquote|Quote|Slash|Backslash|Minus|Equal|BracketLeft|BracketRight|Comma|Semicolon|Period)$/i)) {
        return true;
    }

    return false;
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
        keySoundAudio.currentTime = 0;
        keySoundAudio.muted = false;
        keySoundAudio.play();
    }
}

function editorHandler() {
    editor.innerText = localStorage.getItem('draft');
    textHandler(editor.innerText);

    editor.addEventListener('input', function() {
        localStorage.setItem('draft', this.innerText);
        textHandler(this.innerText);
    });

    editor.addEventListener('keydown', (e) => {
        if (isTypingText(e)) {
            playKeySound();
        }
    });
}

applyConfig('#font-family', 'fontFamily', (fontFamily) => {
    document.body.style.fontFamily = fontFamily;
});

applyConfig('#font-size', 'fontSize', (fontSize) => {
    editor.style.fontSize = fontSize + 'px';
    editor.style.letterSpacing = (fontSize / 25) + 'px';
    wordCount.style.fontSize = fontSize + 'px';
});

applyConfig('#text-color', 'textColor', (color) => {
    editor.style.color = color;

    editor.style.borderColor = makeStyle(color, 0.3);
    wordCount.style.color = makeStyle(color, 0.5);
});

applyConfig('#background-color', 'backgroundColor', (color) => {
    document.body.style.backgroundColor = color;
});

applyConfig('#key-sound', 'keySound', (keySound) => {
    if (keySoundAudio) {
        keySoundAudio = null;
    }

    if (keySound != 'none') {
        keySoundAudio = new Audio('./audio/' + keySound + '.wav');
    }
});

editorHandler();