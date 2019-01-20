var SCREEN_WIDTH = 256;
var SCREEN_HEIGHT = 240;
var FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT;

var canvas_main;
var canvas_nes;
var canvas_ctx, image;
var framebuffer_u8, framebuffer_u32;

var AUDIO_BUFFERING = 512;
var SAMPLE_COUNT = 4 * 1024;
var SAMPLE_MASK = SAMPLE_COUNT - 1;
var audio_samples_L = new Float32Array(SAMPLE_COUNT);
var audio_samples_R = new Float32Array(SAMPLE_COUNT);
var audio_write_cursor = 0,
    audio_read_cursor = 0;

var key_names = {
    0: 'n/a',
    3: 'Break',
    8: 'Backspace / Delete',
    9: 'Tab',
    12: 'Clear',
    13: 'Enter',
    16: 'Shift',
    17: 'Ctrl',
    18: 'Alt',
    19: 'Pause / Break',
    20: 'Caps lock',
    21: 'Hangul',
    25: 'Hanja',
    27: 'Esc',
    28: 'Conversion',
    29: 'Non-conversion',
    32: 'Space',
    33: 'Page up',
    34: 'Page down',
    35: 'End',
    36: 'Home',
    37: 'Left arrow',
    38: 'Up arrow',
    39: 'Right arrow',
    40: 'Down arrow',
    41: 'Select',
    42: 'Print',
    43: 'Execute',
    44: 'Print Screen',
    45: 'Insert',
    46: 'Delete',
    47: 'Help',
    48: '0',
    49: '1',
    50: '2',
    51: '3',
    52: '4',
    53: '5',
    54: '6',
    55: '7',
    56: '8',
    57: '9',
    58: ':',
    59: 'Semicolon (firefox), Equals',
    60: '<',
    61: 'Equals (firefox)',
    63: 'ß',
    64: '@ (firefox)',
    65: 'A',
    66: 'B',
    67: 'C',
    68: 'D',
    69: 'E',
    70: 'F',
    71: 'G',
    72: 'H',
    73: 'I',
    74: 'J',
    75: 'K',
    76: 'L',
    77: 'M',
    78: 'N',
    79: 'O',
    80: 'P',
    81: 'Q',
    82: 'R',
    83: 'S',
    84: 'T',
    85: 'U',
    86: 'V',
    87: 'W',
    88: 'X',
    89: 'Y',
    90: 'Z',
    91: 'Left ⌘',
    92: 'Right window key',
    93: 'Right ⌘',
    95: 'Sleep',
    96: 'Numpad 0',
    97: 'Numpad 1',
    98: 'Numpad 2',
    99: 'Numpad 3',
    100: 'Numpad 4',
    101: 'Numpad 5',
    102: 'Numpad 6',
    103: 'Numpad 7',
    104: 'Numpad 8',
    105: 'Numpad 9',
    106: 'Multiply',
    107: 'Add',
    108: 'Numpad period (firefox)',
    109: 'Subtract',
    110: 'Decimal point',
    111: 'Divide',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    124: 'F13',
    125: 'F14',
    126: 'F15',
    127: 'F16',
    128: 'F17',
    129: 'F18',
    130: 'F19',
    131: 'F20',
    132: 'F21',
    133: 'F22',
    134: 'F23',
    135: 'F24',
    144: 'Num lock',
    145: 'Scroll lock',
    160: '^',
    161: '!',
    162: '؛ (arabic semicolon)',
    163: '#',
    164: '$',
    165: 'ù',
    166: 'Page backward',
    167: 'Page forward',
    168: 'Refresh',
    169: 'Closing paren (AZERTY)',
    170: '*',
    171: '~ + * key',
    172: 'Home key',
    173: 'Minus',
    174: 'Decrease volume level',
    175: 'Increase volume level',
    176: 'Next',
    177: 'Previous',
    178: 'Stop',
    179: 'Play / Pause',
    180: 'eMail',
    181: 'mute/unmute (firefox)',
    182: 'Decrease volume level (firefox)',
    183: 'Increase volume level (firefox)',
    186: 'Semi-colon / ñ',
    187: 'Equal sign',
    188: 'Comma',
    189: 'Dash',
    190: 'Period',
    191: 'Forward slash / ç',
    192: 'Grave accent / ñ / æ / ö',
    193: '?, / or °',
    194: 'Numpad period (chrome)',
    219: 'Open bracket',
    220: 'Back slash',
    221: 'Close bracket / å',
    222: 'Single quote / ø / ä',
    223: '`',
    224: '⌘ (firefox)',
    225: 'Altgr',
    226: '< /git >, left back slash',
    230: 'GNOME Compose Key',
    231: 'ç',
    233: 'XF86Forward',
    234: 'XF86Back',
    235: 'non-conversion',
    240: 'alphanumeric',
    242: 'hiragana/katakana',
    243: 'half-width/full-width',
    244: 'Kanji',
    251: "Unlock trackpad",
    255: 'Toggle touchpad',
};

var start_key_config = false;
var key_config_input = undefined;
var key_config_pos = 0;
var key_config = {
    "up": 38,
    "down": 40,
    "left": 37,
    "right": 39,
    "a": 90,
    "b": 88,
    "select": 32,
    "start": 13,
    "config": 67
};

var nes = new jsnes.NES({
    onFrame: function(framebuffer_24) {
        for (var i = 0; i < FRAMEBUFFER_SIZE; i++) framebuffer_u32[i] = 0xFF000000 | framebuffer_24[i];
    },
    onAudioSample: function(l, r) {
        audio_samples_L[audio_write_cursor] = l;
        audio_samples_R[audio_write_cursor] = r;
        audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK;
    },
});

window.detectGameOver = false;

function onAnimationFrame() {
    window.requestAnimationFrame(onAnimationFrame);
    if (start_key_config) {
        if (undefined !== key_config_input) {
            if (27 == key_config_input) {
                key_config.up = 38;
                key_config.down = 40;
                key_config.left = 37;
                key_config.right = 39;
                key_config.a = 90;
                key_config.b = 88;
                key_config.select = 32;
                key_config.start = 13;
                key_config.config = 67;
            } else if (key_config.up == key_config_input) {
                key_config_pos--;
                if (key_config_pos < 0) {
                    key_config_pos = 5;
                }
            } else if (key_config.down == key_config_input) {
                key_config_pos++;
                if (5 < key_config_pos) {
                    key_config_pos = 0;
                }
            } else if (key_config.left == key_config_input) {
                // ignore
            } else if (key_config.right == key_config_input) {
                // ignore
            } else {
                switch (key_config_pos) {
                    case 0:
                        key_config.a = key_config_input;
                        break;
                    case 1:
                        key_config.b = key_config_input;
                        break;
                    case 2:
                        key_config.start = key_config_input;
                        break;
                    case 3:
                        key_config.select = key_config_input;
                        break;
                    case 4:
                        key_config.config = key_config_input;
                        break;
                    case 5:
                        if (key_config_input == 13) {
                            start_key_config = false;
                            if (window.RPGAtsumaru) {
                                window.RPGAtsumaru.storage.setItems([{
                                    key: "system",
                                    value: JSON.stringify(key_config)
                                }]).then(function() {
                                    console.log("saved key config");
                                });
                            }
                            return;
                        }
                        break;
                }
            }
            key_config_input = undefined;
        }
        canvas_main.save();
        canvas_main.beginPath();
        canvas_main.fillStyle = "#2040a0";
        canvas_main.fillRect(48, 64, 512 - 96, 480 - 128);
        canvas_main.fillStyle = "#c02020";
        canvas_main.fillRect(56, 118 + key_config_pos * 40, 512 - 112, 32);
        canvas_main.font = "16px Arial";
        canvas_main.fillStyle = "#e0e0e0";
        canvas_main.textAlign = "center";
        canvas_main.fillText("--- KEY CONFIG ---", 256, 100);
        canvas_main.textAlign = "right";
        canvas_main.fillText("A BUTTON :", 252, 140);
        canvas_main.fillText("B BUTTON :", 252, 180);
        canvas_main.fillText("START :", 252, 220);
        canvas_main.fillText("SELECT :", 252, 260);
        canvas_main.fillText("KEY CONFIG :", 252, 300);
        canvas_main.textAlign = "left";
        canvas_main.fillText(key_names[key_config.a], 260, 140);
        canvas_main.fillText(key_names[key_config.b], 260, 180);
        canvas_main.fillText(key_names[key_config.start], 260, 220);
        canvas_main.fillText(key_names[key_config.select], 260, 260);
        canvas_main.fillText(key_names[key_config.config], 260, 300);
        canvas_main.textAlign = "center";
        canvas_main.fillText("SAVE & RETURN", 252, 340);
        canvas_main.font = "10px Arial";
        canvas_main.fillStyle = "#c0a0a0";
        canvas_main.fillText("NOTE: push ESC key if you would like to reset settings to the DEFAULT.", 256, 380);
        canvas_main.restore();
        return;
    }
    image.data.set(framebuffer_u8);
    canvas_ctx.putImageData(image, 0, 0);
    canvas_main.save();
    canvas_main.scale(2, 2);
    canvas_main.drawImage(canvas_nes, 0, 0);
    canvas_main.restore();
    nes.frame();
    if (window.onGameOver) {
        if (!window.detectGameOver && wram_check_onStartGameOver()) {
            window.detectGameOver = true;
            window.onGameOver(wram_check_getScore());
        } else if (wram_check_onEndGameOver()) {
            window.detectGameOver = false;
        }
    }
}

function audio_remain() {
    return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK;
}

function audio_callback(event) {
    var dst = event.outputBuffer;
    var len = dst.length;

    // Attempt to avoid buffer underruns.
    if (audio_remain() < AUDIO_BUFFERING) nes.frame();

    var dst_l = dst.getChannelData(0);
    var dst_r = dst.getChannelData(1);
    for (var i = 0; i < len; i++) {
        var src_idx = (audio_read_cursor + i) & SAMPLE_MASK;
        dst_l[i] = audio_samples_L[src_idx];
        dst_r[i] = audio_samples_R[src_idx];
    }

    audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK;
}

function keyboard(callback, event) {
    var player = 1;
    if (key_config.up == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_UP);
    }
    if (key_config.down == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_DOWN);
    }
    if (key_config.left == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_LEFT);
    }
    if (key_config.right == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_RIGHT);
    }
    if (key_config.a == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_A);
    }
    if (key_config.b == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_B);
    }
    if (key_config.select == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_SELECT);
    }
    if (key_config.start == event.keyCode) {
        callback(player, jsnes.Controller.BUTTON_START);
    }
    if (key_config.config == event.keyCode) {
        key_config_input = undefined;
        key_config_pos = 0;
        start_key_config = true;
    }
}

function nes_init(canvas_id) {
    canvas_nes = document.getElementById(canvas_id);
    canvas_ctx = canvas_nes.getContext("2d");
    image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    canvas_ctx.fillStyle = "black";
    canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Allocate framebuffer array.
    var buffer = new ArrayBuffer(image.data.length);
    framebuffer_u8 = new Uint8ClampedArray(buffer);
    framebuffer_u32 = new Uint32Array(buffer);

    // Setup audio.
    var audio_ctx = new window.AudioContext();
    var script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2);
    script_processor.onaudioprocess = audio_callback;
    script_processor.connect(audio_ctx.destination);
}

function nes_boot(rom_data) {
    nes.loadROM(rom_data);
    window.requestAnimationFrame(onAnimationFrame);
}

function nes_load_data(canvas_id, rom_data) {
    nes_init(canvas_id);
    nes_boot(rom_data);
}

function nes_load_url(canvas_id, path) {
    nes_init(canvas_id);
    var canvas = document.getElementById('main-canvas');
    canvas_main = canvas.getContext("2d");
    canvas.addEventListener('touchend', function(event) {
        var z = 640 / canvas.clientWidth;
        var x = event.offsetX * z;
        if (512 <= x && x < 640) {
            console.log("open leaderboard");
            if (window.RPGAtsumaru) {
                window.RPGAtsumaru.experimental.scoreboards.display(1);
            }
        }
    }, false);
    canvas.addEventListener('click', function(event) {
        var z = 640 / canvas.clientWidth;
        var x = event.offsetX * z;
        if (512 <= x && x < 640) {
            console.log("open leaderboard");
            if (window.RPGAtsumaru) {
                window.RPGAtsumaru.experimental.scoreboards.display(1);
            }
        }
    }, false);
    var req = new XMLHttpRequest();
    req.open("GET", path);
    req.overrideMimeType("text/plain; charset=x-user-defined");
    req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);

    req.onload = function() {
        if (this.status === 200) {
            nes_boot(this.responseText);
        } else if (this.status === 0) {
            // Aborted, so ignore error
        } else {
            req.onerror();
        }
    };

    req.send();
}

// setup virtual pad of RPG Atsumaru
function setup_atsumaru_virtual_pad() {
    if (window.RPGAtsumaru) {
        window.RPGAtsumaru.controllers.defaultController.subscribe(function(event) {
            var key = undefined;
            switch (event.key) {
                case "left":
                    key = jsnes.Controller.BUTTON_LEFT;
                    break;
                case "up":
                    key = jsnes.Controller.BUTTON_UP;
                    break;
                case "right":
                    key = jsnes.Controller.BUTTON_RIGHT;
                    break;
                case "down":
                    key = jsnes.Controller.BUTTON_DOWN;
                    break;
                case "ok":
                    key = jsnes.Controller.BUTTON_START;
                    break;
                case "cancel":
                    key = jsnes.Controller.BUTTON_A;
                    break;
            }
            if (undefined !== key) {
                if (event.type === 'keydown') {
                    nes.buttonDown(1, key);
                } else {
                    nes.buttonUp(1, key);
                }
            }
        });
    } else {
        console.log("RPG atsumaru v-pad does not exist.");
    }
}

function nes_clear_all_buttons() {
    nes.buttonUp(1, jsnes.Controller.BUTTON_UP);
    nes.buttonUp(1, jsnes.Controller.BUTTON_DOWN);
    nes.buttonUp(1, jsnes.Controller.BUTTON_LEFT);
    nes.buttonUp(1, jsnes.Controller.BUTTON_RIGHT);
    nes.buttonUp(1, jsnes.Controller.BUTTON_A);
    nes.buttonUp(1, jsnes.Controller.BUTTON_B);
    nes.buttonUp(1, jsnes.Controller.BUTTON_SELECT);
    nes.buttonUp(1, jsnes.Controller.BUTTON_START);
}

function update_ranking_list() {
    canvas_main.save();
    canvas_main.scale(1, 1);
    canvas_main.beginPath();
    canvas_main.fillStyle = "#2040a0";
    canvas_main.fillRect(512, 0, 128, 480);
    canvas_main.font = "12px Arial";
    canvas_main.fillStyle = "#ffffff";
    canvas_main.textAlign = "center";
    canvas_main.fillText("SCORE RANKING", 512 + 64, 12, 128);

    if (!window.RPGAtsumaru) return;
    var bp = window.RPGAtsumaru.experimental.scoreboards.getRecords(1);
    if (!bp) return;
    bp.then(function(board) {
        var startIndex = 0;
        var myIndex = undefined;
        if (board.myBestRecord) {
            for (var i = 0; i < board.ranking.length; i++) {
                if (board.ranking[i].rank == board.myBestRecord.rank && board.ranking[i].userName == board.myBestRecord.userName) {
                    myIndex = i;
                    break;
                }
            }
            if (undefined == myIndex || myIndex < 10 || board.ranking.length < 20) {
                // 頭から表示
                startIndex = 0;
            } else if (board.ranking.length - myIndex < 10) {
                // 末尾から表示
                startIndex = board.ranking.length - 20;
            } else {
                // 自分より上の10人, 自分, 下の9人を表示
                startIndex = myIndex - 10;
            }
        }
        for (var i = 0; i < 20; i++) {
            var ii = i + startIndex;
            if (board.ranking.length <= ii) break;
            var rank = board.ranking[ii].rank;
            switch (rank % 10) {
                case 1:
                    rank = rank + "st";
                    break;
                case 2:
                    rank = rank + "nd";
                    break;
                case 3:
                    rank = rank + "rd";
                    break;
                default:
                    rank = rank + "th";
                    break;
            }
            canvas_main.fillStyle = ii === myIndex ? "#c02020" : "#2020b0";
            canvas_main.fillRect(512, 25 + 2 + i * 22.5, 128, -11);
            canvas_main.font = "10px Arial";
            canvas_main.fillStyle = "#a0a0a0";
            canvas_main.textAlign = "left";
            canvas_main.fillText(rank + " " + board.ranking[ii].score + "pts", 512 + 4, 25 + i * 22.5, 120);
            canvas_main.fillStyle = "#c0c0c0";
            canvas_main.textAlign = "left";
            canvas_main.fillText(board.ranking[ii].userName, 512 + 16, 35 + i * 22.5, 128 - 16 - 4);
        }
        canvas_main.restore();
    });
}

document.addEventListener('keydown', (event) => {
    if (start_key_config) return;
    keyboard(nes.buttonDown, event)
});
document.addEventListener('keyup', (event) => {
    if (start_key_config) {
        key_config_input = event.keyCode;
    }
    keyboard(nes.buttonUp, event)
});