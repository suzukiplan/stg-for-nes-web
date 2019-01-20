function wram_check_onStartGameOver() {
    return 0 != nes.cpu.mem[1] && 0 == nes.cpu.mem[15];
}

function wram_check_getScore() {
    return 10 * (parseInt(nes.cpu.mem[22]) + parseInt(nes.cpu.mem[23]) * 256 + parseInt(nes.cpu.mem[24]) * 65536);
}

function wram_check_onEndGameOver() {
    return 0 == nes.cpu.mem[1];
}