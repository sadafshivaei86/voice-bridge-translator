const recordBtn = document.getElementById('record-btn');
const recordStatus = document.getElementById('record-status');
const transcriptionArea = document.getElementById('transcription');
const translationArea = document.getElementById('translation');
const langToggle = document.getElementById('lang-toggle');
const langFromLabel = document.getElementById('lang-from');
const langToLabel = document.getElementById('lang-to');

let isListening = false;
let recognition;

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
        // Using MyMemory API (Free public translation API)
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();

        if (data.responseData) {
            translationArea.textContent = data.responseData.translatedText;
        } else {
            translationArea.textContent = 'Translation failed. Try again.';
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
    recognition.stop();
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
    
    if (isListening) {
        stopListening();
    }
});

// Set initial active state
langToLabel.classList.add('active');
