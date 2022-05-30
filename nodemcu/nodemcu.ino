// @file WebServer.ino
// @brief Example implementation using the ESP8266 WebServer.

#include <Arduino.h>
#include "ArduinoJson.h"
#include <ESP8266WiFi.h>
#include <ESP8266WebServerSecure.h>
#include <ESP8266mDNS.h>

// TRACE output simplified, can be deactivated here
#define TRACE(...) Serial.printf(__VA_ARGS__)

// ricky's sensor shit
#include "HX711.h" // Include the library for weight sensor
#define cf 475000.0 //This value is obtained using the SparkFun_HX711_Calibration sketch
#define DOUT_PIN 5 // Nodemcu pin D1
#define SCK_PIN 4 // Nodemcu pin D2
HX711 scale; //Initializing object scale of type HX711

BearSSL::ESP8266WebServerSecure server(443);  

static const char serverCert[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIC5zCCAlCgAwIBAgIUJUAPL3CojF/HypRIvbZN1NDNrLYwDQYJKoZIhvcNAQEL
BQAweTELMAkGA1UEBhMCUk8xCjAIBgNVBAgMAUIxEjAQBgNVBAcMCUJ1Y2hhcmVz
dDEbMBkGA1UECgwST25lVHJhbnNpc3RvciBbUk9dMRYwFAYDVQQLDA1PbmVUcmFu
c2lzdG9yMRUwEwYDVQQDDAwxOTIuMTY4LjEuNzAwHhcNMjIwNDA1MDEzOTUxWhcN
MjMwNDA1MDEzOTUxWjB5MQswCQYDVQQGEwJSTzEKMAgGA1UECAwBQjESMBAGA1UE
BwwJQnVjaGFyZXN0MRswGQYDVQQKDBJPbmVUcmFuc2lzdG9yIFtST10xFjAUBgNV
BAsMDU9uZVRyYW5zaXN0b3IxFTATBgNVBAMMDDE5Mi4xNjguMS43MDCBnzANBgkq
hkiG9w0BAQEFAAOBjQAwgYkCgYEA1NFjzkhxZYGByoyeiCNCABqenwQzm2OBQ4Hv
MXRJi71N0Mi2TFbTdfskA7Vr0qvsIJAe5S7+wQmb2+g60qhuenL+nzWroblzlWfG
DBA7OI34vNhvfgFDa6vvjOkKuX3myU8kHymJl4voDuLs8LDBYYQEedbf9+ltVXvn
68l8ldMCAwEAAaNsMGowHQYDVR0OBBYEFK6M9i/y01sDqNJYnT4XkSTwGtLtMB8G
A1UdIwQYMBaAFK6M9i/y01sDqNJYnT4XkSTwGtLtMA8GA1UdEwEB/wQFMAMBAf8w
FwYDVR0RBBAwDoIMMTkyLjE2OC4xLjcwMA0GCSqGSIb3DQEBCwUAA4GBADKS9m7f
yGCUYQjhFn9OU3jON2Msd3imDO1FPOFCe7Umqu2rJHVtkdfaPhg1KrxjQGU2N10q
XR7YjNsEuNxznlO5dZxFmlHgG3ydHG2wyYOG8KzNKHs15MTI4jNTElumv2w4n5Tk
q15+gAg/8qgzzItEuG+f0IYuyr1gEoZXsEfk
-----END CERTIFICATE-----
)EOF";

static const char serverKey[] PROGMEM =  R"EOF(
-----BEGIN PRIVATE KEY-----
MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBANTRY85IcWWBgcqM
nogjQgAanp8EM5tjgUOB7zF0SYu9TdDItkxW03X7JAO1a9Kr7CCQHuUu/sEJm9vo
OtKobnpy/p81q6G5c5VnxgwQOziN+LzYb34BQ2ur74zpCrl95slPJB8piZeL6A7i
7PCwwWGEBHnW3/fpbVV75+vJfJXTAgMBAAECgYApQ2wpnAw4lTK4Nimq1cM/R+oH
hQYIk/OFRlU9boGwEYVb/P6zsIYRsx8ZhPyh/WmsKqWC5GjKvvU0X0PAgp3gz28v
NUKqqJI9orh28guBhWWupp/X0aBcgYsZSozEj8qEYZeAcmFev6ZabDJAl7rKb9bY
NsJE6skpX06CQHMHqQJBAPc5ZDOsEjEz13NhLUcn6lnMF+yB6r28sOlwpk0HIrrE
xLNPuRS3BMyRJqCMj/RK3+niNCas0vave4miWXDz+/UCQQDcX1ZbjSvSsR8kPVmM
FU8IIVx9O+ASi/wtTLMKsm/jfIMV4PglGsFOJ7PtlkDnv++6yRVI1tHsg8lLyNWO
E7WnAkEA0kskW/vbgbTqaP/ZZvSiGP5Nv2WHixvtlLS5ET6noR1tgGWpNuCzmVtC
80B91zy1mRpMaDWMQkBlIl9SG42+3QJADinCbxffnSbtDXMz8iDcd3VNcG8Ms6Rz
jKXFTAaz0jcKZbmTuS7DBbbfhYGGol5fle2ehJPp4f2GTmyV7Q+vOQJBAM8pDuGT
RgDhq477KR0gRr+X8bOu0GXrXt90nnTciazep+kXLNx1z94rsZOJDN6a5DD++N/F
1Do2jmTXziNAfJk=
-----END PRIVATE KEY-----
)EOF";

// Setup everything to make the webserver work.
void setup(void) {
  float weight = 0;
  delay(3000);  // wait for serial monitor to start completely.

  scale.begin(DOUT_PIN, SCK_PIN); // initialize the weight sensor
  scale.set_scale(cf); //This value is obtained by using the SparkFun_HX711_Calibration sketch
  scale.tare(); //Assuming there is no weight on the scale at start up, reset the scale to 0
  
  // Use Serial port for some trace information from the example
  Serial.begin(115200);

  TRACE("Starting WebServer example...\n");

  // start WiFI
  WiFi.mode(WIFI_STA);
  WiFi.begin("TELUS1810", "9dv97g8m7a");

  TRACE("Connect to WiFi...\n");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    TRACE(".");
  }
  TRACE("connected.\n");
  
  if (MDNS.begin("esp8266")) {  //Start mDNS with name esp8266
    Serial.println("MDNS started");
  }
    
  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  
  server.getServer().setRSACert(new BearSSL::X509List(serverCert), new BearSSL::PrivateKey(serverKey));
  // register a redirect handler when only domain name is given.
  server.on("/", []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "Hello World!");
  });

  server.on("/weight", getWeight);
  server.onNotFound(handleNotFound);
  
  server.begin();
  Serial.print("IP=");
  Serial.print(WiFi.localIP());
}


// run the server...
void loop(void) {
  server.handleClient();
  MDNS.update();
}  // loop()

void getWeight(){
  DynamicJsonDocument doc(1024);
  float weight = scale.get_units(); // check the current data from weight sensor
  doc["weight"] = weight;
  String result = doc.as<String>();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/json", result);
}

void handleNotFound()
{
    if (server.method() == HTTP_OPTIONS)
    {
        server.sendHeader("Access-Control-Allow-Origin", "http://10.0.0.154");
        server.sendHeader("Access-Control-Max-Age", "10000");
        server.sendHeader("Access-Control-Allow-Methods", "PUT,POST,GET,OPTIONS");
        server.sendHeader("Access-Control-Allow-Headers", "*");
        server.send(204);
    }
    else
    {
        server.send(404, "text/plain", "");
    }
}
