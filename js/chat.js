class Chat {
    #chatID;
    #apiResponse;
    #btnClear;
    #promptForm;
    #URL_BASE;

    #trainingPrompt;
    #conversationHistory;


    constructor(chatID, apiResponse, btnClear, promptForm, prompt, URL) {
        this.#chatID = chatID;
        this.#apiResponse = apiResponse;
        this.#btnClear = btnClear;
        this.#trainingPrompt = prompt;
        this.#promptForm = promptForm
        this.#URL_BASE = URL
        this.#conversationHistory = [{ role: "system", content: this.#trainingPrompt}];

        this.subscribeEvents();
    }

    renderConversationHistory() {
        let conversationElement = this.#apiResponse;
        conversationElement.innerHTML = ''; // Limpiar la conversación actual
        
       this.#conversationHistory.filter(message => message.role !== "system").forEach(message => {
            let messageElement = document.createElement("div");
            messageElement.classList.add('message-bubble');
            messageElement.classList.add(message.role === "user" ? "user" : "assistant");
    
            // Aplicar la clase writing si el mensaje es "escribiendo" o alguna variación de este
            if (message.content.startsWith("escribiendo")) {
                messageElement.classList.add("writing");
            }
    
            messageElement.innerText = message.content;
            conversationElement.appendChild(messageElement);
        });

        let lastMessageElement = conversationElement.lastChild;
        if (lastMessageElement) {
            lastMessageElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    resetConversation() {
        this.#chatID.value = '';
        this.#apiResponse.innerHTML = ''; // Limpiar la visualización de la conversación
        this.#conversationHistory = [{ role: "system", content: this.#trainingPrompt }]; // Reiniciar con el prompt de entrenamiento
        this.renderConversationHistory();
    }

    sendMessage() {
        let userPrompt = this.#chatID.value.trim();
        if (userPrompt === '') return; // No enviar mensajes vacíos
    
        // Mostrar el mensaje del usuario inmediatamente
        this.#conversationHistory.push({ role: "user", content: userPrompt });
        this.renderConversationHistory();
    
        // Inicializar "escribiendo" con puntos dinámicos
        let dots = "";
        let writingIndex = this.#conversationHistory.length; // Índice para la burbuja "escribiendo..."
        this.#conversationHistory.push({ role: "assistant", content: `escribiendo${dots}` });
        this.renderConversationHistory();
    
        // Intervalo para actualizar el mensaje "escribiendo..."
        let writingInterval = setInterval(() => {
            dots = dots.length < 3 ? dots + "." : "";
            this.#conversationHistory[writingIndex] = { role: "assistant", content: `escribiendo${dots}` };
            this.renderConversationHistory();
        }, 500); // Actualiza cada 500 ms
    
        // Limpia el área de texto después de enviar el mensaje
        this.#chatID.value = '';
    
        // Preparar datos para la API
        let dataToSend = {
            messages: this.#conversationHistory.slice(0, -1) // Excluir "escribiendo..."
        };
    
        // Llamada a la API para procesar la respuesta
        fetch(this.#URL_BASE, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Psico-API-Key': '94705224-bhvg-4745-mac7-f15c455858f4'
            },
            body: JSON.stringify(dataToSend)
        })
        .then(response => response.json())
        .then(data => {
            clearInterval(writingInterval); // Detener el intervalo de "escribiendo..."
            // Remover la burbuja "escribiendo..." antes de añadir la respuesta real
            this.#conversationHistory.splice(writingIndex, 1); // Eliminar el elemento en el índice de "escribiendo..."
            if (!this.#conversationHistory.find(m => m.content === data.response)) {
                this.#conversationHistory.push({ role: "assistant", content: data.response });
            }
            this.renderConversationHistory();
        })
        .catch((error) => {
            clearInterval(writingInterval); // Detener el intervalo de "escribiendo..." en caso de error
            console.error('Error:', error);
            // Remover la burbuja "escribiendo..." y mostrar error
            this.#conversationHistory.splice(writingIndex, 1); // Eliminar "escribiendo..."
            this.#conversationHistory.push({ role: "assistant", content: `Error: ${error}` });
            this.renderConversationHistory();
        });
    }

    subscribeEvents() {
        // Agregar evento al formulario para manejar el envío de mensajes
        this.#promptForm.addEventListener("submit", (event) => {
            event.preventDefault();
            this.sendMessage();
        });

        // Evento para detectar la tecla Enter y enviar el mensaje
        this.#chatID.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Previene el comportamiento por defecto del Enter
                this.sendMessage();
            }
        });

        // Evento para el botón de resetear la conversación
        this.#btnClear.addEventListener('click', () => this.resetConversation);
    
    }
}



