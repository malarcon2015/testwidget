(function() {
    const COMPONENT_NAME = 'medical-chat-widget';

    const styles = `
        :host {
            --mcw-primary: #38bdf8;
            --mcw-bg: #1e293b;
            --mcw-header-bg: #1e293b;
            --mcw-text: #f1f5f9;
            --mcw-text-muted: #94a3b8;
            --mcw-border: #334155;
            --mcw-message-bg: #334155;
            --mcw-ai-message-bg: #0f172a;
            --mcw-font: 'Inter', system-ui, -apple-system, sans-serif;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: var(--mcw-font);
        }

        .mcw-floating-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: var(--mcw-primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease, background-color 0.2s ease;
            font-size: 24px;
        }

        .mcw-floating-button:hover {
            transform: scale(1.1);
            background-color: #0ea5e9;
        }

        .mcw-container {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background-color: var(--mcw-bg);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            overflow: hidden;
            border: 1px solid var(--mcw-border);
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .mcw-container.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
        }

        .mcw-header {
            background-color: var(--mcw-header-bg);
            padding: 16px;
            border-bottom: 1px solid var(--mcw-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .mcw-header h3 {
            margin: 0;
            color: var(--mcw-primary);
            font-size: 1.1rem;
            font-weight: 600;
        }

        .mcw-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .mcw-message {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 0.9rem;
            line-height: 1.4;
            color: var(--mcw-text);
        }

        .mcw-message.user {
            align-self: flex-end;
            background-color: var(--mcw-primary);
            color: white;
            border-bottom-right-radius: 2px;
        }

        .mcw-message.ai {
            align-self: flex-start;
            background-color: var(--mcw-ai-message-bg);
            border-bottom-left-radius: 2px;
            border: 1px solid var(--mcw-border);
        }

        .mcw-footer {
            padding: 16px;
            border-top: 1px solid var(--mcw-border);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .mcw-input-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .mcw-input-group label {
            font-size: 0.75rem;
            color: var(--mcw-text-muted);
        }

        .mcw-input, .mcw-textarea {
            background-color: #0f172a;
            border: 1px solid var(--mcw-border);
            color: var(--mcw-text);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s ease;
        }

        .mcw-input:focus, .mcw-textarea:focus {
            border-color: var(--mcw-primary);
        }

        .mcw-textarea {
            resize: none;
            height: 60px;
        }

        .mcw-send-btn {
            background-color: var(--mcw-primary);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .mcw-send-btn:hover {
            background-color: #0ea5e9;
        }

        .mcw-send-btn:disabled {
            background-color: #334155;
            cursor: not-allowed;
        }

        .mcw-typing {
            font-size: 0.8rem;
            color: var(--mcw-text-muted);
            margin-bottom: 8px;
            display: none;
        }

        /* Simple Markdown Styling */
        .mcw-message strong {
            color: var(--mcw-primary);
            font-weight: bold;
        }

        /* Scrollbar */
        .mcw-messages::-webkit-scrollbar {
            width: 6px;
        }
        .mcw-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        .mcw-messages::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 10px;
        }
    `;

    class MedicalChatWidget extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.isOpen = localStorage.getItem('mcw-open') === 'true';
            this.messages = JSON.parse(localStorage.getItem('mcw-history') || '[]');
        }

        connectedCallback() {
            this.render();
            this.scrollToBottom();
        }

        toggleChat() {
            this.isOpen = !this.isOpen;
            localStorage.setItem('mcw-open', this.isOpen);
            const container = this.shadowRoot.querySelector('.mcw-container');
            if (this.isOpen) {
                container.classList.add('open');
            } else {
                container.classList.remove('open');
            }
        }

        formatMarkdown(text) {
            // Very basic markdown processing: **bold** -> <strong>bold</strong>
            return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                       .replace(/\n/g, '<br>');
        }

        addMessage(role, content) {
            const msg = { role, content, timestamp: new Date().getTime() };
            this.messages.push(msg);
            localStorage.setItem('mcw-history', JSON.stringify(this.messages));
            this.renderMessage(msg);
            this.scrollToBottom();
        }

        renderMessage(msg) {
            const messagesDiv = this.shadowRoot.querySelector('.mcw-messages');
            const messageEl = document.createElement('div');
            messageEl.className = `mcw-message ${msg.role}`;
            messageEl.innerHTML = this.formatMarkdown(msg.content);
            messagesDiv.appendChild(messageEl);
        }

        scrollToBottom() {
            const messagesDiv = this.shadowRoot.querySelector('.mcw-messages');
            setTimeout(() => {
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 50);
        }

        async sendMessage() {
            //const patientIdInput = this.shadowRoot.querySelector('#mcw-patient-id');
            const queryInput = this.shadowRoot.querySelector('#mcw-query');
            const sendBtn = this.shadowRoot.querySelector('.mcw-send-btn');
            const typingIndicator = this.shadowRoot.querySelector('.mcw-typing');

            //const patient_id = patientIdInput.value.trim();
            const query = queryInput.value.trim();

            if (!query) return;

            this.addMessage('user', query);
            queryInput.value = '';

            // Show thinking
            typingIndicator.style.display = 'block';
            sendBtn.disabled = true;
            this.scrollToBottom();

            try {
                const response = await fetch('http://medical-assistant-app.eastus2.cloudapp.azure.com/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patient_id: '111111',
                        query: query,
                        user_id: 'doctor_chaymae'
                    })
                });

                const data = await response.json();
                typingIndicator.style.display = 'none';
                sendBtn.disabled = false;

                if (data.response) {
                    this.addMessage('ai', data.response);
                } else {
                    this.addMessage('ai', 'Lo siento, no pude procesar tu consulta.');
                }
            } catch (error) {
                console.error('MCW Error:', error);
                typingIndicator.style.display = 'none';
                sendBtn.disabled = false;
                this.addMessage('ai', 'Error de conexión con el servidor médico.');
            }
        }

        render() {
            this.shadowRoot.innerHTML = `
                <style>${styles}</style>
                <div class="mcw-floating-button" id="mcw-toggle">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="10" y1="10" x2="14" y2="10"></line>
                    </svg>
                </div>
                <div class="mcw-container ${this.isOpen ? 'open' : ''}">
                    <div class="mcw-header">
                        <h3>Asistente Médico AI</h3>
                    </div>
                    <div class="mcw-messages">
                        <!-- Messages go here -->
                    </div>
                    <div class="mcw-typing">Pensando...</div>
                    <div class="mcw-footer">

                        <div class="mcw-input-group">
                            <label for="mcw-query">Consulta</label>
                            <textarea id="mcw-query" class="mcw-textarea" placeholder="¿Cómo puedo ayudarle?"></textarea>
                        </div>
                        <button class="mcw-send-btn" id="mcw-send">
                            Enviar Consulta
                        </button>
                    </div>
                </div>
            `;

            // Load history
            this.messages.forEach(msg => this.renderMessage(msg));

            // Event Listeners
            this.shadowRoot.querySelector('#mcw-toggle').addEventListener('click', () => this.toggleChat());
            this.shadowRoot.querySelector('#mcw-send').addEventListener('click', () => this.sendMessage());
            this.shadowRoot.querySelector('#mcw-query').addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    // Register Component
    if (!customElements.get(COMPONENT_NAME)) {
        customElements.define(COMPONENT_NAME, MedicalChatWidget);
    }

    // Inyectar el tag si no existe
    window.addEventListener('DOMContentLoaded', () => {
        if (!document.querySelector(COMPONENT_NAME)) {
            const widget = document.createElement(COMPONENT_NAME);
            document.body.appendChild(widget);
        }
    });

})();
