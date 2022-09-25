let signal2: number[] = [9124, 4514, 586, 558, 585, 558, 586, 557, 587, 1674, 585, 1674, 586, 1674, 586, 1675, 585, 559, 586, 1676, 586, 1674, 585, 1674, 587, 558, 586, 557, 587, 556, 586, 558, 586, 1674, 585, 1676, 585, 1676, 584, 1674, 586, 1673, 585, 559, 585, 1674, 584, 559, 586, 557, 585, 558, 585, 558, 586, 557, 586, 557, 585, 1673, 586, 557, 585, 1674, 586, 1674, 585, 40200, 9116, 2257, 584];
let signals: number[][] = [[]];
let signalNr: number = 0;
let mapping: number[] = [];

let pin = AnalogPin.P0
pins.analogWritePin(pin, 0);
pins.analogSetPeriod(pin, 26);

function enableIrMarkSpaceDetection(pin: DigitalPin) {
    pins.setPull(pin, PinPullMode.PullNone);

    let mark = 0;
    let space = 0;

    pins.onPulsed(pin, PulseValue.Low, () => {
        // HIGH, see https://github.com/microsoft/pxt-microbit/issues/1416
        mark = pins.pulseDuration();
        signals[signalNr].push(mark)
    });

    pins.onPulsed(pin, PulseValue.High, () => {
        // LOW
        space = pins.pulseDuration();
        if (space > 500000){
            signals[signalNr] = []
        } else {
            signals[signalNr].push(space)
        }
    });
}

enableIrMarkSpaceDetection(DigitalPin.P2)

input.onButtonPressed(Button.AB, function () {
    serial.writeNumbers([signals.length])
    for (let signal of signals){
        serial.writeNumbers([1])
        serial.writeNumbers(signal)
        send(signal)
        basic.pause(1000)
    }
})

input.onButtonPressed(Button.A, function () {
    send(signals[signalNr])
})

input.onButtonPressed(Button.B, function() {
    signals.push([])
    signalNr += 1
})

function send(signal: number[]){
    let isHight = false;
    for (let time of signal) {
        if (isHight) {
            pins.analogWritePin(pin, 1);
        } else {
            pins.analogWritePin(pin, 511);
        }

        control.waitMicros(time);
        isHight = !isHight
    }
    pins.analogWritePin(pin, 0);
}