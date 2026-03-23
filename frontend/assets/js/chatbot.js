// chatbot.js - EcoWatch AI Assistant

const chatbotHTML = `
    <link rel="stylesheet" href="assets/css/chatbot.css">
    <div id="ecoChatbotContainer">
        <button id="ecoChatbotBtn" onclick="toggleEcoChat()">
            <span class="material-icons-round">smart_toy</span>
        </button>
        <div id="ecoChatWindow">
            <div id="ecoChatHeader">
                <div class="chat-title">
                    <span class="material-icons-round">eco</span>
                    EcoBot Assistant
                </div>
                <button id="ecoChatClose" onclick="toggleEcoChat()">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <div id="ecoChatMessages">
                <!-- Messages go here -->
            </div>
            <div id="ecoChatInputArea">
                <input type="text" id="ecoChatInput" placeholder="Ask me anything..." onkeypress="handleEcoChatKey(event)">
                <button id="ecoChatSend" onclick="sendEcoChatMessage()">
                    <span class="material-icons-round" style="font-size: 1.2rem;">send</span>
                </button>
            </div>
        </div>
    </div>
`;

let hasGreeted = false;

document.addEventListener('DOMContentLoaded', () => {
    // Inject chatbot to body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
});

window.toggleEcoChat = function() {
    const chatWindow = document.getElementById('ecoChatWindow');
    if (chatWindow.style.display === 'flex') {
        chatWindow.style.display = 'none';
        document.getElementById('ecoChatbotBtn').style.transform = 'scale(1)';
    } else {
        chatWindow.style.display = 'flex';
        document.getElementById('ecoChatbotBtn').style.transform = 'scale(0.9)';
        document.getElementById('ecoChatInput').focus();
        
        if (!hasGreeted) {
            hasGreeted = true;
            setTimeout(() => {
                addEcoBotMessage("Hi! I'm EcoBot. I can help you report incidents, check status, or answer questions about EcoWatch. What do you need help with?", [
                    "How to report poaching?",
                    "What happens after?",
                    "Are reports anonymous?"
                ]);
            }, 300);
        }
    }
}

window.handleEcoChatKey = function(event) {
    if (event.key === 'Enter') {
        sendEcoChatMessage();
    }
}

window.sendEcoChatMessage = function() {
    const input = document.getElementById('ecoChatInput');
    const text = input.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    input.value = '';
    
    processBotLogic(text);
}

window.handleChatOptionClick = function(btn) {
    const text = btn.innerText;
    addUserMessage(text);
    processBotLogic(text);
    // Remove options from previous message so it doesn't get cluttered
    const btnParent = btn.parentElement;
    if(btnParent) btnParent.style.display = 'none';
}

function processBotLogic(text) {
    const lowerText = text.toLowerCase();
    
    // Show typing status (optional, but skipping for speed and just using timeout)
    setTimeout(() => {
        if (lowerText.includes('report') || lowerText.includes('poach')) {
            addEcoBotMessage("You can submit a detailed report using the 'New Report' button on your dashboard. Provide clear photos and location details to help authorities act faster.", []);
        } 
        else if (lowerText.includes('happen') || lowerText.includes('after')) {
            addEcoBotMessage("Once you report, an Admin reviews it and dispatches the most suitable Authority team. You'll get notified at every step. Check 'My Grievances' to track progress.", ["How long does it take?"]);
        }
        else if (lowerText.includes('anonymous') || lowerText.includes('hide') || lowerText.includes('privacy')) {
            addEcoBotMessage("Yes! We take privacy seriously. Your identity is secured and not publicly disclosed without your consent.", []);
        }
        else if (lowerText.includes('time') || lowerText.includes('long') || lowerText.includes('take')) {
            addEcoBotMessage("Emergency reports are processed immediately and authorities are usually dispatched within 30 minutes! For non-emergencies, please allow 24-48 hours.", []);
        }
        else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
            addEcoBotMessage("Hello! I'm EcoBot. I can help answer any questions you have about our platform or wildlife protection procedures.", ["How to report poaching?"]);
        }
        else {
            addEcoBotMessage("I'm still learning! Could you rephrase your question, or try selecting one of the common topics?", [
                "How to report poaching?",
                "Are reports anonymous?"
            ]);
        }
    }, 600);
}

function addUserMessage(text) {
    const container = document.getElementById('ecoChatMessages');
    const timeObj = new Date();
    const timeStr = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    container.innerHTML += `
        <div class="chat-bubble user">
            ${text}
            <span class="chat-time">${timeStr}</span>
        </div>
    `;
    scrollToBottomChat();
}

function addEcoBotMessage(text, options = []) {
    const container = document.getElementById('ecoChatMessages');
    const timeObj = new Date();
    const timeStr = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    let optionsHtml = '';
    if (options.length > 0) {
        optionsHtml = '<div class="chatbot-options">';
        options.forEach(opt => {
            optionsHtml += `<button class="chat-option-btn" onclick="handleChatOptionClick(this)">${opt}</button>`;
        });
        optionsHtml += '</div>';
    }
    
    container.innerHTML += `
        <div class="chat-bubble bot">
            ${text}
            ${optionsHtml}
            <span class="chat-time">${timeStr}</span>
        </div>
    `;
    scrollToBottomChat();
}

function scrollToBottomChat() {
    const container = document.getElementById('ecoChatMessages');
    container.scrollTop = container.scrollHeight;
}
