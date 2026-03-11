const recordBtn = document.getElementById('record-btn');
const recordStatus = document.getElementById('record-status');
const transcriptionArea = document.getElementById('transcription');
const translationArea = document.getElementById('translation');
const subtitleText = document.getElementById('subtitle-text');
const langToggle = document.getElementById('lang-toggle');
const langFromLabel = document.getElementById('lang-from');
const langToLabel = document.getElementById('lang-to');
const videoFeed = document.getElementById('video-feed');

let isListening = false;
let recognition;
let stream;

// Initialize Camera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoFeed.srcObject = stream;
    } catch (error) {
        console.error('Camera Access Error:', error);
        subtitleText.textContent = 'Camera access denied. Video feed disabled.';
    }
}

initCamera();

// Initialize Speech Recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        recordBtn.classList.add('listening');
        recordStatus.textContent = 'Listening...';
    };

    recognition.onend = () => {
        isListening = false;
        recordBtn.classList.remove('listening');
        recordStatus.textContent = 'Start Listening';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
            transcriptionArea.textContent = currentText;
            if (finalTranscript) {
                translateText(finalTranscript);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        stopListening();
    };
} else {
    recordStatus.textContent = 'Browser not supported';
    recordBtn.disabled = true;
}

// Translation Logic
async function translateText(text) {
    const sourceLang = langToggle.checked ? 'fi' : 'en';
    const targetLang = langToggle.checked ? 'en' : 'fi';

    translationArea.textContent = 'Translating...';

    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();

        if (data.responseData) {
            const translated = data.responseData.translatedText;
            translationArea.textContent = translated;
            subtitleText.textContent = translated;

            // Clear subtitle after 5 seconds of inactivity
            setTimeout(() => {
                if (subtitleText.textContent === translated) {
                    subtitleText.textContent = '';
                }
            }, 5000);
        } else {
            translationArea.textContent = 'Translation failed.';
        }
    } catch (error) {
        console.error('Translation Error:', error);
        translationArea.textContent = 'Error connecting to translation service.';
    }
}

// UI Interaction
function startListening() {
    const lang = langToggle.checked ? 'fi-FI' : 'en-US';
    recognition.lang = lang;
    recognition.start();
}

function stopListening() {
    if (recognition) recognition.stop();
}

recordBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

langToggle.addEventListener('change', () => {
    if (langToggle.checked) {
        langFromLabel.textContent = 'Finnish';
        langToLabel.textContent = 'English';
        langFromLabel.classList.add('active');
        langToLabel.classList.remove('active');
    } else {
        langFromLabel.textContent = 'English';
        langToLabel.textContent = 'Finnish';
        langFromLabel.classList.remove('active');
        langToLabel.classList.add('active');
    }

    // Clear display on switch
    transcriptionArea.textContent = 'Waiting for voice input...';
    translationArea.textContent = 'Translation will appear here...';
    subtitleText.textContent = 'Waiting for speech...';

    if (isListening) {
        stopListening();
    }
});

// Set initial active state
langToLabel.classList.add('active');
