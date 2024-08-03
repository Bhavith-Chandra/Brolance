document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror
    var codeEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: "javascript",
        theme: "dracula",
        lineNumbers: true
    });

    document.querySelector('.run-button').addEventListener('click', function() {
        const code = codeEditor.getValue();
        try {
            const output = eval(code);
            document.getElementById('output').textContent = output;
        } catch (error) {
            document.getElementById('output').textContent = error;
        }
    });

    document.querySelector('.reset-button').addEventListener('click', function() {
        codeEditor.setValue('');
        document.getElementById('output').textContent = '';
    });

    document.querySelector('.submit-button').addEventListener('click', function() {
        const code = codeEditor.getValue();
        alert('Code submitted successfully!');
        // Here you would typically send the code to the server for evaluation
    });

    // Accessing the microphone and visualizing voice waves
    const listenButton = document.getElementById('listen-button');
    const sendButton = document.getElementById('send-button');
    const voiceWave = document.getElementById('voice-wave');
    const chatWindow = document.getElementById('chat-window');

    let isListening = false;
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;
    let recognition;
    let role = 'Me'; // Default role for transcription

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = function(event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            chatWindow.innerHTML = `<p><strong>${role}:</strong> ${transcript}</p>`;
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error detected: ' + event.error);
        };
    } else {
        alert('Speech recognition is not supported in this browser.');
    }

    function startListening() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;

                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);

                javascriptNode.onaudioprocess = function() {
                    var array = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(array);
                    drawVoiceWave(array);
                };

                voiceWave.getContext('2d').clearRect(0, 0, voiceWave.width, voiceWave.height); // Clear the canvas
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
            });
    }

    function stopListening() {
        if (microphone) {
            microphone.disconnect();
        }
        if (analyser) {
            analyser.disconnect();
        }
        if (javascriptNode) {
            javascriptNode.disconnect();
        }
        if (audioContext) {
            audioContext.close();
        }
    }

    listenButton.addEventListener('click', function() {
        role = 'AI';
        if (!isListening) {
            startListening();
            recognition.start();
            isListening = true;
            listenButton.textContent = 'Stop Listening';
        } else {
            stopListening();
            recognition.stop();
            isListening = false;
            listenButton.textContent = 'Listen';
        }
    });

    sendButton.addEventListener('click', function() {
        role = 'Me';
        if (!isListening) {
            startListening();
            recognition.start();
            isListening = true;
            sendButton.textContent = 'Stop Sending';
        } else {
            stopListening();
            recognition.stop();
            isListening = false;
            sendButton.textContent = 'Send';
        }
    });

    function drawVoiceWave(array) {
        const canvas = voiceWave;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerY = height / 2;
        const amplitude = height / 2;
        const margin = 10; // Distance from the left and right borders

        const color = '#ff6b81'; // Consistent color

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const barWidth = (width - 2 * margin) / array.length; // Adjust for margin
        let hasAudio = false;
        array.forEach((value, index) => {
            const x = margin + index * barWidth;
            const y = centerY - (value / 256) * amplitude;
            if (value > 0) {
                hasAudio = true;
            }
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        if (!hasAudio) {
            ctx.moveTo(margin, centerY);
            ctx.lineTo(width - margin, centerY);
        }

        ctx.stroke();
    }

    // Initial draw to make the line always visible
    drawVoiceWave(new Uint8Array(1024).fill(128));
});
