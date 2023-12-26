const int redLed = 13;      // OUT LED0 built-in arduino
const int photoPin = A0;    // IN Photo transistor pin
const int mousepin = A5;    // IN mouse click detection
const int mouseLed = 3;     // OUT LED1 mouse click detected GREEN
const int flashLedOk = 5;   // OUT LED2 flash detected BLUE
const int flashLedErr = 7;  // OUT LED2 flash not detected RED
const int demoLed = 12;     // OUT LED3 demo when mouse click detected WHITE
int count = 0;
int timeout = 1000;
unsigned long clickTime;
unsigned long flashTime;
unsigned long delayTime;
// float mouseVoltage;
// float sensorVoltage;
int mouseVoltage;
int sensorVoltage;

void setup() {
  pinMode(demoLed, OUTPUT);
  pinMode(redLed, OUTPUT);
  pinMode(mouseLed, OUTPUT);
  pinMode(flashLedOk, OUTPUT);
  pinMode(flashLedErr, OUTPUT);
  pinMode(mousepin, INPUT_PULLUP);
  // pinMode(mousepin, INPUT);
  Serial.begin(9600);
  initLed();
}

void initLed() {
  for (int i = 0; i < 2; i++) {
    blink(demoLed, 100);
    blink(flashLedOk, 100);
    blink(mouseLed, 100);
    blink(flashLedErr, 100);
  }
}

void blink(long pin, long time) {
  digitalWrite(pin, HIGH);
  delay(time);
  digitalWrite(pin, LOW);
}

void loop() {
  static int i;
  // check if mouse button pressed
  // mouseVoltage = (float)(analogRead(mousepin) * 5.0) / 1024;
  mouseVoltage = analogRead(mousepin);
  // if (mouseVoltage < 0.1) {
  if (mouseVoltage < 21) {
    digitalWrite(demoLed, HIGH);
    digitalWrite(mouseLed, HIGH);
    clickTime = micros();
    count = 0;

    // waiting for flash to be deteced
    for (i = 0; i < timeout; i++) {
      // we can convert value to Volts but better to avoid unnecessary calculations
      // sensorVoltage = (float)(analogRead(photoPin) * 5.0) / 1024;
      sensorVoltage = analogRead(photoPin);
      // if (sensorVoltage > 4.5) {
      if (sensorVoltage > 800) {
        flashTime = micros();
        print(clickTime, flashTime, count);
        blink(flashLedOk, 100);
        break;
      }
      count++;
    }
    // time to detect flash is out
    if (count >= timeout) {
      flashTime = micros();
      print(clickTime, flashTime, timeout);
      blink(flashLedErr, 100);
    }
  } else {
    // turn off LEDs
    digitalWrite(demoLed, LOW);
    digitalWrite(mouseLed, LOW);
  }
}


void print(long startTime, long endTime, int count) {

  delayTime = endTime - startTime;
  Serial.print("delay:");
  Serial.print(delayTime);
  Serial.print(" μs count:");
  Serial.print(count);
  float frequency = (float)1000000 * count / delayTime;
  Serial.print(" freq:");
  Serial.print(frequency);
  Serial.print(" hz");

  if (count < 10) {
    Serial.print(" this value should be skipped because it was too fast, check and disable DEMO switch");
  } else if (count >= timeout) {
    Serial.print(" flash not detected, time is out");
  }
  Serial.println();
}


// void loop() {
//   float mouseVoltage = (float)(analogRead(mousepin) * 5.0) / 1024;
//   Serial.print(mouseVoltage);
//   Serial.print("  ");
//   // float photoVoltage = (float)(analogRead(photoPin) * 5.0) / 1024;
//   // Serial.print(photoVoltage);
//   Serial.println();
//   delay(10);
//   if (mouseVoltage < 0.1) {
//     digitalWrite(redLed, HIGH);
//   } else {
//     digitalWrite(redLed, LOW);
//   }
// }

// void loop() {
//   // Включаем светодиод
//   digitalWrite(whiteLed, HIGH);
//   digitalWrite(redLed, HIGH);
//   startTime = micros();

//   float voltage = 0;
//   count = 0;
//   for (int i = 0; i < 1000; i++) {
//     voltage = (float)(analogRead(photoPin) * 5.0) / 1024;
//     count++;
//     if (voltage > 4.5) {
//       break;
//     }
//   }

//   digitalWrite(whiteLed, LOW);  // external led off
//   digitalWrite(redLed, LOW);  // internal led off
//   int state1 = digitalRead(3);
//   int state2 = digitalRead(4);
//   // Serial.print(state1);
//   // Serial.print(state2);
//   // if (state1 == HIGH && state2 == HIGH) {
//   //   Serial.print("!!!");
//   // }


//   print(startTime, micros(), count);

//   delay(1000);         // wait
//   Serial.println("");  //crlf
// }

// void loop() {
//   mouseVoltage = (float)(analogRead(mousepin) * 5.0) / 1024;
//   if (mouseVoltage < 0.1) {
//     digitalWrite(demoLed, HIGH);
//     clickTime = micros();
//     count = 0;
//   } else {
//     digitalWrite(demoLed, LOW);
//   }

//   sensorVoltage = (float)(analogRead(photoPin) * 5.0) / 1024;
//   if (sensorVoltage > 4) {
//     flashTime = micros();
//     print(clickTime, flashTime, 0);
//   }
//   count++;
// }
