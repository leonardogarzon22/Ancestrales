/**
 * Módulo Global de Navegación por Voz con Wake Word ("Joao iníciate por favor")
 */

const initVoiceNavigation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn("API de reconocimiento de voz no soportada en este navegador.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = true; // Escucha continua activada
    recognition.interimResults = false;

    let isJoaoAwake = false;
    let sleepTimer = null;
    let microphoneAuthorized = false;

    const routes = {
        "inicio": "index.html",
        "tienda": "tienda.html",
        "comprar": "tienda.html",
        "bienestar": "bienestar2.html",
        "historia": "historia3.html",
        "origen": "historia3.html",
        "sommelier": "sommelier.html",
        "asesor": "sommelier.html"
    };

    // UI Feedback: Un pequeño indicador visual de que Joao está escuchando
    const createStatusIndicator = () => {
        const indicator = document.createElement("div");
        indicator.id = "joaoStatus";
        indicator.style.cssText = `
            position: fixed;
            bottom: 25px; 
            left: 25px;
            background: #0f0d0c;
            color: #c5a059;
            border: 1px solid #c5a059;
            padding: 8px 15px;
            border-radius: 20px;
            font-family: 'Cinzel', serif;
            font-size: 0.7rem;
            z-index: 3000;
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(197, 160, 89, 0.2);
        `;
        document.body.appendChild(indicator);
        return indicator;
    };

    let statusElement;
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => { statusElement = createStatusIndicator(); });
    } else {
        statusElement = createStatusIndicator();
    }

    const updateStatus = (message, show) => {
        if (!statusElement) return;
        statusElement.innerText = message;
        statusElement.style.opacity = show ? "1" : "0";
    };

    const goToSleep = () => {
        isJoaoAwake = false;
        updateStatus("", false);
        console.log("Joao ha vuelto a modo de espera.");
    };

    recognition.onresult = (event) => {
        // Obtener el último resultado pronunciado
        const current = event.results.length - 1;
        const transcript = event.results[current][0].transcript.toLowerCase().trim();
        
        // Normalizar texto (quitar tildes para evitar fallos de coincidencia)
        const normalizedTranscript = transcript.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        console.log(`Detectado: "${normalizedTranscript}"`);

        // FASE 1: Esperando la palabra de activación
        if (!isJoaoAwake) {
            if (normalizedTranscript.includes("joao") && normalizedTranscript.includes("iniciate por favor")) {
                isJoaoAwake = true;
                console.log("¡Joao despertó!");
                updateStatus("Joao escuchando...", true);
                
                // Joao se duerme automáticamente tras 8 segundos sin comandos
                clearTimeout(sleepTimer);
                sleepTimer = setTimeout(goToSleep, 8000);
            }
            return; // Detenemos aquí si no estaba despierto
        }

        // FASE 2: Joao está despierto y procesa comandos
        // Reiniciamos el temporizador de sueño porque el usuario está hablando
        clearTimeout(sleepTimer);
        sleepTimer = setTimeout(goToSleep, 8000);

        // Lógica de Enrutamiento
        for (const [keyword, url] of Object.entries(routes)) {
            if (normalizedTranscript.includes(keyword)) {
                updateStatus(`Abriendo ${keyword}...`, true);
                setTimeout(() => window.location.href = url, 800);
                return;
            }
        }

        // Lógica de Interacción (Carrito)
        if (normalizedTranscript.includes("carrito") || normalizedTranscript.includes("reserva")) {
            if (typeof toggleCart === "function") {
                toggleCart();
                goToSleep(); // Se apaga tras cumplir la orden
                return;
            }
        }

        // Lógica de Accesibilidad Visual
        if (normalizedTranscript.includes("accesibilidad") || normalizedTranscript.includes("modo lectura")) {
            if (typeof toggleAccesibilidad === "function") {
                toggleAccesibilidad();
                goToSleep();
                return;
            } else if (document.getElementById('accToggle')) {
                document.getElementById('accToggle').click();
                goToSleep();
                return;
            }
        }
    };

    // Bucle infinito: Reinicia el micrófono silenciosamente si se apaga por falta de sonido
    recognition.onend = () => {
        if (microphoneAuthorized) {
            try {
                recognition.start();
            } catch (e) {
                // Silenciar errores de colisión de arranque
            }
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
            console.error("Permiso de micrófono denegado.");
            microphoneAuthorized = false;
        }
    };

    // Activar el micrófono en la primera interacción del usuario con la página
    const unlockMicrophone = () => {
        if (!microphoneAuthorized) {
            try {
                recognition.start();
                microphoneAuthorized = true;
                console.log("Micrófono habilitado. Joao está esperando su frase de activación.");
                
                // Remover los event listeners para no llamarlo múltiples veces
                document.removeEventListener('click', unlockMicrophone);
                document.removeEventListener('keydown', unlockMicrophone);
            } catch (e) {
                console.log("Iniciando reconocimiento...");
            }
        }
    };

    document.addEventListener('click', unlockMicrophone);
    document.addEventListener('keydown', unlockMicrophone);
};

// Inicializar el módulo
initVoiceNavigation();