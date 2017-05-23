'use stric';
let AWS = require('aws-sdk');
let Stream = require('stream');
let speaker = require('speaker');
let weather = require("yahoo-weather");
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'us-east-1'
});
const Player = new speaker({
  channels: 1,
  bitDepth: 16,
  sampleRate: 16000
});

weather('novo-hamburgo').then(info => {
  let inverno = info.item.condition.temp;
  let params = {
      'Text': '  Olá Anderson, a temperatura hoje é de '+inverno+' graus, use um agasalho',
      'OutputFormat': 'pcm',
      'VoiceId': 'Ricardo'
  };

  Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
          console.log(err.code);
      } else if (data) {
          if (data.AudioStream instanceof Buffer) {
              var bufferStream = new Stream.PassThrough();
              bufferStream.end(data.AudioStream);
              bufferStream.pipe(Player);
          }
      }
  });
}).catch(err => {
});
