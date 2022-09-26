
// --- Settings ---
let irDiodePin = AnalogPin.P0
let irReceiverPin = DigitalPin.P2
// ---

let signals: number[][] = [];
let currentSignal: number[] = [];

pins.analogWritePin(irDiodePin, 0);
pins.analogSetPeriod(irDiodePin, 26);

function enableIrMarkSpaceDetection(irDiodePin: DigitalPin) {
    pins.setPull(irDiodePin, PinPullMode.PullNone);

    let mark = 0;
    let space = 0;

    pins.onPulsed(irDiodePin, PulseValue.Low, () => {
        mark = pins.pulseDuration();
        currentSignal.push(mark)
    });

    pins.onPulsed(irDiodePin, PulseValue.High, () => {
        space = pins.pulseDuration();
        if (space > 100000){
            currentSignal = []
        } else {
            currentSignal.push(space)
        }
    });
}

enableIrMarkSpaceDetection(irReceiverPin)

input.onButtonPressed(Button.AB, function () {
    // Show stored signals.
    serial.writeString("Recorded signals:\n")

    for (let i = 0; i < signals.length; i++) {
        serial.writeString(i + "\n")
        serial.writeNumbers(signals[i])
    }

    // Send stored signals.
    for (let signal of signals){
        send(signal)
        basic.pause(1000)
    }
})

// Send the last received signal.
input.onButtonPressed(Button.A, function () {
    send(currentSignal)
})

// Store the last received signal.
input.onButtonPressed(Button.B, function() {
    signals.push(currentSignal)
})

function send(signal: number[]){
    let isHight = false;
    for (let time of signal) {
        if (isHight) {
            pins.analogWritePin(irDiodePin, 1);
        } else {
            pins.analogWritePin(irDiodePin, 511);
        }

        control.waitMicros(time);
        isHight = !isHight
    }
    pins.analogWritePin(irDiodePin, 0);
}

// --- Processing the last received signal. ---

let lastSignal = '';
let lastSignalCheckNr = 0;

basic.forever(() => {
    let currentSignalKey = currentSignal.join('_');
    if (currentSignalKey != ''){
        if (lastSignal != currentSignalKey) {
            lastSignal = currentSignalKey
            lastSignalCheckNr = 0
        } else {
            lastSignalCheckNr++;

            if (lastSignalCheckNr == 1) {
                control.runInBackground(() => {
                    processSignal()
                })
            }
        }
    }
})

// Checks if the current signal matches a stored signal.

function processSignal(){
    for (let i = 0; i < signals.length; i++) {
        let signal = signals[i]

        let test = true;
        for (let n = 0; n < signal.length; n++){
            if (currentSignal[n] > signal[n] + 50 || currentSignal[n] < signal[n] - 50){
                test = false;
                break;
            }
        }

        if (test){
            runOnSignal(i)
        } else {
            continue;
        }
    }
}

// Runs the command when the recorded signal appears.

function runOnSignal(signalId: number){
    basic.showNumber(signalId)

    if (signalId == 0){
        basic.clearScreen()
        music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 1600, 1, 255, 0, 300, SoundExpressionEffect.None, InterpolationCurve.Curve), SoundExpressionPlayMode.UntilDone)
    } else if (signalId == 1) {
        basic.showIcon(IconNames.Heart)
        music.playSoundEffect(music.createSoundEffect(WaveShape.Noise, 54, 54, 255, 0, 500, SoundExpressionEffect.None, InterpolationCurve.Linear), SoundExpressionPlayMode.UntilDone)
    } else if (signalId == 2) {
        basic.showIcon(IconNames.House)
        music.playSoundEffect(music.createSoundEffect(WaveShape.Square, 400, 600, 255, 0, 100, SoundExpressionEffect.Warble, InterpolationCurve.Linear), SoundExpressionPlayMode.UntilDone)
    }
}