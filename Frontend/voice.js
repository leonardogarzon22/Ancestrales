// voice.js - Motor de Voz para Ancestrales (Asistente Joao)

window.VoiceEngine = (function () {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    let isJoaoAwake = localStorage.getItem('joao_estado') === 'despierto';
    let isJoaoSpeaking = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'es-CO';
        recognition.interimResults = false;
    } else {
        console.warn("La Web Speech API no es compatible con este navegador.");
    }

    // ==========================================
    // 1. INYECCIÓN DE LA INTERFAZ (LOGOS Y DEPURADOR)
    // ==========================================
    function inyectarInterfaz() {
        // --- Botón Flotante para los Logos PNG ---
        const btnVoz = document.createElement('div');
        btnVoz.id = 'voice-trigger';
        btnVoz.style.position = 'fixed';
        btnVoz.style.bottom = '120px';
        btnVoz.style.right = '20px';
        btnVoz.style.cursor = 'pointer';
        btnVoz.style.zIndex = '99999';
        btnVoz.style.transition = 'transform 0.3s ease';

        btnVoz.innerHTML = `
        <img
            id="voice-logo-img"
            src="mic-inactivo.png"
            alt="Micrófono"
            style="
                width: 150px;
                height: 150px;
                object-fit: contain;
                filter: drop-shadow(0 6px 12px rgba(0,0,0,0.35));
                transition: all 0.3s ease;
            "
        >
    `;

        btnVoz.onclick = () => window.VoiceEngine.toggle();
        document.body.appendChild(btnVoz);

        // --- Depurador en Pantalla ---
        const debugDiv = document.createElement('div');
        debugDiv.id = 'joao-debug-overlay';
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '15px';
        debugDiv.style.left = '50%';
        debugDiv.style.transform = 'translateX(-50%)';
        debugDiv.style.backgroundColor = 'rgba(28, 28, 30, 0.9)';
        debugDiv.style.color = '#f4f1ea';
        debugDiv.style.padding = '10px 20px';
        debugDiv.style.borderRadius = '8px';
        debugDiv.style.fontSize = '12px';
        debugDiv.style.fontFamily = "'Montserrat', sans-serif";
        debugDiv.style.zIndex = '99999';
        debugDiv.style.textAlign = 'center';
        debugDiv.style.border = '1px solid #c5a059';
        debugDiv.style.display = isJoaoAwake ? 'block' : 'none';
        debugDiv.innerHTML = `Joao en reposo...`;

        document.body.appendChild(debugDiv);
    }
    function updateUI() {
        const logoImg = document.getElementById('voice-logo-img');
        const debugDiv = document.getElementById('joao-debug-overlay');
        const trigger = document.getElementById('voice-trigger');

        if (logoImg && debugDiv) {
            if (isJoaoAwake) {
                logoImg.src = 'mic-activo.png';
                trigger.style.transform = 'scale(1.1)';
                debugDiv.style.display = 'block';
                debugDiv.innerHTML = `Joao escuchando... <br><span style="color:#c5a059; font-size:10px;">Di "Adiós Joao" para apagar</span>`;
            } else {
                logoImg.src = 'mic-inactivo.png';
                trigger.style.transform = 'scale(1)';
                debugDiv.style.display = 'none';
            }
        }
    }

    function actualizarDepurador(texto) {
        const debugDiv = document.getElementById('joao-debug-overlay');
        if (debugDiv && isJoaoAwake) {
            debugDiv.innerHTML = `Comando: <b style="color:#c5a059;">"${texto}"</b>`;
        }
    }

    // ==========================================
    // 2. SÍNTESIS DE VOZ (FEEDBACK AUDITIVO)
    // ==========================================
    function speak(text) {
        if (!text) return;
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-CO';
        utterance.rate = 1.0;

        utterance.onstart = () => {
            isJoaoSpeaking = true;
            if (recognition && isListening) recognition.abort();
        };

        utterance.onend = () => {
            setTimeout(() => {
                isJoaoSpeaking = false;
                startPhysicalListening();
            }, 400);
        };

        synth.speak(utterance);
    }

    // ==========================================
    // 3. NAVEGACIÓN Y COMANDOS DEL PROYECTO
    // ==========================================
    const comandosAncestrales = [
        {
            regex: /(ir a |volver a |ver )?(inicio|principal)/i,
            action: () => {
                speak("Regresando a la página principal.");
                setTimeout(() => window.location.href = 'index.html', 1000);
            }
        },
        {
            regex: /(ir a |abrir |ver )?(tienda|productos|colección|coleccion)/i,
            action: () => {
                speak("Abriendo la colección de origen.");
                setTimeout(() => window.location.href = 'tienda.html', 1000);
            }
        },
        {
            regex: /(ir a |abrir |ver )?bienestar/i,
            action: () => {
                speak("Accediendo a los rituales de bienestar ancestral.");
                setTimeout(() => window.location.href = 'bienestar2.html', 1000);
            }
        },
        {
            regex: /(ir a |abrir |ver )?(historia|el origen|origen)/i,
            action: () => {
                speak("Abriendo nuestra historia y legado.");
                setTimeout(() => window.location.href = 'historia3.html', 1000);
            }
        },
        {
            regex: /(consultar |hablar con el |abrir )?sommelier/i,
            action: () => {
                speak("Conectando con el sommelier.");
                setTimeout(() => window.location.href = 'sommelier.html', 1000);
            }
        },
        {
            regex: /(abrir |ver |mostrar )?(carrito|reserva|mi selección|mi seleccion)/i,
            action: () => {
                if (typeof toggleCart === 'function') {
                    speak("Abriendo tu selección.");
                    toggleCart();
                } else {
                    speak("El carrito no está disponible en esta página.");
                }
            }
        }
    ];

    // ==========================================
    // 4. PROCESAMIENTO DEL TEXTO
    // ==========================================
    function processTranscript(transcript) {
        if (isJoaoSpeaking) return;

        let lowerTranscript = transcript.toLowerCase().trim();
        actualizarDepurador(lowerTranscript);

        // Activadores
        if (lowerTranscript.includes('joao iníciate') || lowerTranscript.includes('joao iniciate') || lowerTranscript.includes('activar a joao')) {
            if (!isJoaoAwake) {
                isJoaoAwake = true;
                localStorage.setItem('joao_estado', 'despierto');
                speak("Joao activado y listo.");
                updateUI();
            }
            return;
        }

        // Desactivadores
        if (lowerTranscript.includes('hasta luego joao') || lowerTranscript.includes('adiós joao') || lowerTranscript.includes('adios joao')) {
            if (isJoaoAwake) {
                isJoaoAwake = false;
                localStorage.setItem('joao_estado', 'dormido');
                speak("Joao entrando en reposo.");
                updateUI();
            }
            return;
        }

        if (!isJoaoAwake) return;

        // Limpieza de texto para comandos directos (ej: "Joao, ir a tienda" -> "ir a tienda")
        let cleanTranscript = lowerTranscript.replace(/^(por favor|oye|escucha|joao)[,\s]*/g, '').trim();

        for (let cmd of comandosAncestrales) {
            const match = cleanTranscript.match(cmd.regex);
            if (match) {
                cmd.action(match);
                return;
            }
        }
    }

    function startPhysicalListening() {
        if (isJoaoSpeaking) return;
        if (recognition && !isListening) {
            try {
                recognition.start();
                isListening = true;
            } catch (e) { }
        }
    }

    if (recognition) {
        recognition.onresult = (event) => {
            if (isJoaoSpeaking) return;
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            processTranscript(transcript);
        };

        recognition.onend = () => {
            isListening = false;
            if (!isJoaoSpeaking) startPhysicalListening();
        };
    }

    window.addEventListener('load', () => {
        inyectarInterfaz();
        startPhysicalListening();
        updateUI();
    });

    return {
        toggle: function () {
            isJoaoAwake = !isJoaoAwake;
            localStorage.setItem('joao_estado', isJoaoAwake ? 'despierto' : 'dormido');
            speak(isJoaoAwake ? "Joao te está escuchando." : "Joao apagado.");
            updateUI();
        },
        feedback: speak
    };
})();