'use stric';
let city = process.env.CITY_POLLY;
let AWS = require('aws-sdk');
let Stream = require('stream');
let speaker = require('speaker');
let weather = require("yahoo-weather");
let mqtt = require('mqtt');
let client = mqtt.connect('mqtt://test.mosquitto.org');

const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'us-east-1'
});

client.on('connect', function() {
  console.log('City config:'+ city);
  console.log('Connected to the MQTT Broker [test.mosquitto.org]!\nPub \'temp\' on /pollyjarvis/pt or /pollyjarvis/en');
  client.subscribe('/pollyjarvis/#');
});

client.on('message', function(topic, message) {
  console.log('MQTT Pub: '+topic+' - '+message);
  if (message.indexOf("temp") > -1) {
    console.log("Requesting temperature...");
    readWeatherProvis(topic.split('/')[2]);
  }
});

function readWeatherProvis(language) {
  weather(city).then(info => {
    let weatherTemp = info.item.condition.temp;
    let params;
    if (language === 'pt') {
      params = {
        'Text': '  Olá amigo, a temperatura em '+city+' é de ' + weatherTemp + ' graus',
        'OutputFormat': 'pcm',
        'VoiceId': 'Ricardo'
      };
    } else {
      params = {
        'Text': '  Hi friend, the temperature on '+city+' is around '+weatherTemp + ' degrees Celsius',
        'OutputFormat': 'pcm',
        'VoiceId': 'Joey'
      };
    }

    Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
        console.log(err.code);
      } else if (data) {
        if (data.AudioStream instanceof Buffer) {
          let Player = new speaker({
            channels: 1,
            bitDepth: 16,
            sampleRate: 16000
          });

          let bufferStream = new Stream.PassThrough();
          bufferStream.pipe(Player);
          bufferStream.end(data.AudioStream);
        }
      }
    });
  }).catch(err => {});
}
