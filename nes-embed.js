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
    image.data.set(framebuffer_u8);
    canvas_ctx.putImageData(image, 0, 0);
    canvas_main.save();
    canvas_main.scale(2, 2);
    canvas_main.drawImage(canvas_nes, 0, 0);
    canvas_main.restore();
    nes.frame();
    if (window.onGameOver) {
        if (!window.detectGameOver && 0 != nes.cpu.mem[1] && 0 == nes.cpu.mem[15]) {
            window.detectGameOver = true;
            window.onGameOver(10 * (parseInt(nes.cpu.mem[22]) + parseInt(nes.cpu.mem[23]) * 256 + parseInt(nes.cpu.mem[24]) * 65536));
        } else if (0 == nes.cpu.mem[1]) {
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
    switch (event.keyCode) {
        case 38: // UP
            callback(player, jsnes.Controller.BUTTON_UP);
            break;
        case 40: // Down
            callback(player, jsnes.Controller.BUTTON_DOWN);
            break;
        case 37: // Left
            callback(player, jsnes.Controller.BUTTON_LEFT);
            break;
        case 39: // Right
            callback(player, jsnes.Controller.BUTTON_RIGHT);
            break;
        case 90: // 'z'
            callback(player, jsnes.Controller.BUTTON_A);
            break;
        case 88: // 'x'
            callback(player, jsnes.Controller.BUTTON_B);
            break;
        case 32: // Space
            callback(player, jsnes.Controller.BUTTON_SELECT);
            break;
        case 13: // Return
            callback(player, jsnes.Controller.BUTTON_START);
            break;
        default:
            break;
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
        window.RPGAtsumaru.experimental.scoreboards.display(1);
    }, false);
    canvas.addEventListener('click', function(event) {
        window.RPGAtsumaru.experimental.scoreboards.display(1);
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
    keyboard(nes.buttonDown, event)
});
document.addEventListener('keyup', (event) => {
    keyboard(nes.buttonUp, event)
});