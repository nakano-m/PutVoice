// ref: http://cyokodog.github.io/JS_STUDY/web-audio/presen/
window.URL = window.URL || window.webkitURL;
var audioContext;
var BUFFERSIZE = 4096;
var RECORDABLE_MILLISECOND = 5000;
var audioBufferArray = [];

(function initWebAudio() {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new window.AudioContext();
  } catch(e) {
    alert('not supported Web Audio API in your browser.');
    console.error(e);
  }
})();
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

/*
 * export audio data as .wav file
 */
var exportWAV = function(audioData, sampleRate) {
  var encodeWAV = function(samples, sampleRate) {
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);
    var writeString = function(view, offset, string) {
      for (var i = 0; i < string.length; i++){
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    var floatTo16BitPCM = function(output, offset, input) {
      for (var i = 0; i < input.length; i++, offset += 2){
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };
    writeString(view, 0, 'RIFF');  // RIFF header
    view.setUint32(4, 32 + samples.length * 2, true); // file size
    writeString(view, 8, 'WAVE'); // WAVE header
    writeString(view, 12, 'fmt '); // fmt chunk
    view.setUint32(16, 16, true); // byte of fmt chunk
    view.setUint16(20, 1, true); // format ID
    view.setUint16(22, 1, true); // the number of channel
    view.setUint32(24, sampleRate, true); // sampling late
    view.setUint32(28, sampleRate * 2, true); // data speed
    view.setUint16(32, 2, true); // block size
    view.setUint16(34, 16, true); // bit per sample
    writeString(view, 36, 'data'); // data chunk
    view.setUint32(40, samples.length * 2, true); // byte of waveform
    floatTo16BitPCM(view, 44, samples); // data of waveform
    return view;
  };
  var mergeBuffers = function(audioData) {
    var sampleLength = 0;
    for (var i = 0; i < audioData.length; i++) {
      sampleLength += audioData[i].length;
    }
    var samples = new Float32Array(sampleLength);
    var sampleIdx = 0;
    for (var i = 0; i < audioData.length; i++) {
      for (var j = 0; j < audioData[i].length; j++) {
        samples[sampleIdx] = audioData[i][j];
        sampleIdx++;
      }
    }
    return samples;
  };
  var dataview = encodeWAV(mergeBuffers(audioData), sampleRate);
  var audioBlob = new Blob([dataview], { type: 'audio/wav' });
  return audioBlob;
};

/*
 * get audio data as buffer array data
 */
var getAudioBuffer = function(audioBufferArray, bufferSize) {
  var buffer = audioContext.createBuffer(
    1,
    audioBufferArray.length * bufferSize,
    audioContext.sampleRate
  );
  var channel = buffer.getChannelData(0);
  for (var i = 0; i < audioBufferArray.length; i++) {
    for (var j = 0; j < bufferSize; j++) {
      channel[i * bufferSize + j] = audioBufferArray[i][j];
    }
  }
  return buffer;
};
var onAudioProcess = function(event) {
  var channel = event.inputBuffer.getChannelData(0);
  var buffer = new Float32Array(BUFFERSIZE);
  for (var i = 0; i < BUFFERSIZE; i++) {
    buffer[i] = channel[i];
  }
  window.audioBufferArray.push(buffer);
};
