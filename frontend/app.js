// DOM Elements
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const uploadedFilesDiv = document.getElementById('uploadedFiles');
const inputError = document.getElementById('inputError');

// --- IMPORTANT: Replace these with your actual backend API endpoints ---
const BACKEND_API_URL = 'http://localhost:8000/chat'; // Updated to your local backend
const UPLOAD_API_URL = '/api/upload'; // Example: 'https://your-backend.com/api/upload'

// --- Initial Welcome Message ---
document.addEventListener('DOMContentLoaded', () => {
    addMessageToChatbox(
        "I am GLOW and I'm here to support you with real-time inventory insights, document analysis (PDF, Excel, CSV), and live data retrieval from our CRM and backend systems. Please enter your query, and I'll handle the rest.",
        'bot'
    );
    
    // Create example questions element
    const exampleQuestions = document.createElement('div');
    exampleQuestions.classList.add('text-sm', 'sm:text-base', 'break-words');
    
    const questionList = document.createElement('ul');
    const questions = [
        "Questions you can ask:",
        "What EV models are available in Mercedes that compete with an Etron",
        "Summarize the Q4 sales report.",
        "Show me customer history for ID 12345."
    ];
    
    questions.forEach(question => {
        const li = document.createElement('li');
        li.textContent = question;
        questionList.appendChild(li);
    });
    
    exampleQuestions.appendChild(questionList);
    
    // Add example questions after a delay
    setTimeout(() => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-bubble', 'max-w-lg', 'md:max-w-xl', 'p-3', 'rounded-xl', 'shadow', 'bg-slate-200', 'text-slate-800', 'self-start', 'mr-auto');
        messageElement.appendChild(exampleQuestions);
        chatbox.appendChild(messageElement);
    }, 500);
});

// --- Event Listeners ---
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

uploadBtn.addEventListener('click', () => {
    fileInput.click(); 
});

fileInput.addEventListener('change', (event) => {
    handleFileUpload(event.target.files);
});

// --- Core Functions ---

/**
 * Handles sending a user message to the backend and displaying the response.
 */
async function sendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '') {
        inputError.classList.remove('hidden');
        return; 
    }
    inputError.classList.add('hidden');

    addMessageToChatbox(messageText, 'user');
    userInput.value = ''; 

    typingIndicator.classList.remove('hidden');
    typingIndicator.classList.add('flex');

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: messageText })
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) { /* Ignore if error response is not JSON */ }
            throw new Error(errorMessage);
        }

        const botResponseData = await response.json();
        console.log('Response:', botResponseData);
        
        setTimeout(() => {
            let replyText;
            if (typeof botResponseData === 'string') {
                replyText = botResponseData;
            } else if (botResponseData.reply) {
                replyText = botResponseData.reply;
            } else if (botResponseData.message) {
                replyText = botResponseData.message;
            } else if (botResponseData.response) {
                replyText = botResponseData.response;
            } else {
                replyText = 'Received response from server';
            }
            
            addMessageToChatbox(replyText, 'bot', false);
            
            if (botResponseData.sources && Array.isArray(botResponseData.sources)) {
                const sourcesContainer = document.createElement('div');
                sourcesContainer.classList.add('text-xs', 'text-slate-500', 'mt-1');
                
                const sourcesText = document.createElement('em');
                sourcesText.textContent = 'Sources:';
                sourcesContainer.appendChild(sourcesText);
                
                const sourcesList = document.createElement('ul');
                botResponseData.sources.forEach(source => {
                    const li = document.createElement('li');
                    li.classList.add('truncate');
                    li.textContent = source;
                    li.title = source;
                    sourcesList.appendChild(li);
                });
                
                sourcesContainer.appendChild(sourcesList);
                addMessageToChatbox(sourcesContainer, 'bot', true);
            }
        }, 300);

    } catch (error) {
        console.error('Error sending message or fetching response:', error);
        addMessageToChatbox(`Sorry, I encountered an error: ${error.message}. Please check the console or try again.`, 'bot');
    } finally {
        typingIndicator.classList.add('hidden');
        typingIndicator.classList.remove('flex');
    }
}

/**
 * Adds a message to the chatbox.
 * @param {string} message - The message text.
 * @param {string} sender - 'user' or 'bot'.
 * @param {boolean} isHtml - Whether the message content is HTML.
 */
function addMessageToChatbox(message, sender, isHtml = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-bubble', 'max-w-lg', 'md:max-w-xl', 'p-3', 'rounded-xl', 'shadow');
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeElement = document.createElement('span');
    timeElement.classList.add('text-xs', 'opacity-70', 'ml-2');
    timeElement.textContent = timestamp;

    if (sender === 'user') {
        messageElement.classList.add('bg-sky-500', 'text-white', 'self-end', 'ml-auto');
        const p = document.createElement('p');
        p.classList.add('text-sm', 'sm:text-base', 'break-words');
        p.textContent = message;
        messageElement.appendChild(p);
        messageElement.appendChild(timeElement);
    } else {
        messageElement.classList.add('bg-slate-200', 'text-slate-800', 'self-start', 'mr-auto');
        if (isHtml) {
            if (message instanceof HTMLElement) {
                messageElement.appendChild(message);
            } else {
                const p = document.createElement('p');
                p.classList.add('text-sm', 'sm:text-base', 'break-words');
                p.textContent = message;
                messageElement.appendChild(p);
            }
        } else {
            const p = document.createElement('p');
            p.classList.add('text-sm', 'sm:text-base', 'break-words');
            p.textContent = message;
            messageElement.appendChild(p);
        }
        messageElement.appendChild(timeElement);
    }
    
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

/**
 * Handles file uploads by sending them to the backend.
 * @param {FileList} files - The list of files selected by the user.
 */
async function handleFileUpload(files) {
    if (files.length === 0) {
        return;
    }

    if (uploadedFilesDiv.querySelector('p.italic')) {
        uploadedFilesDiv.innerHTML = ''; // Clear "No documents" message
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create a visual element for the uploading file
        const fileElement = document.createElement('div');
        fileElement.classList.add('bg-slate-600', 'p-2', 'rounded-md', 'text-slate-200', 'flex', 'justify-between', 'items-center', 'text-xs', 'sm:text-sm', 'mb-1');
        
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = file.name.length > 20 ? file.name.substring(0,17) + '...' : file.name; // Truncate long names
        fileNameSpan.title = file.name;

        const fileStatusSpan = document.createElement('span');
        fileStatusSpan.classList.add('text-sky-400');
        fileStatusSpan.textContent = 'Uploading...';
        
        fileElement.appendChild(fileNameSpan);
        fileElement.appendChild(fileStatusSpan);
        uploadedFilesDiv.appendChild(fileElement);

        // --- Actual File Upload API Call ---
        const formData = new FormData();
        formData.append('file', file); // 'file' is a common key, adjust if your backend expects a different key name

        try {
            const response = await fetch(UPLOAD_API_URL, {
                method: 'POST',
                body: formData,
                // Note: For FormData, 'Content-Type' header is usually set automatically by the browser (multipart/form-data).
                // Add any other headers like Authorization if needed
            });

            if (!response.ok) {
                let errorMessage = `Upload failed. Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) { /* Ignore */ }
                throw new Error(errorMessage);
            }

            const result = await response.json(); // Assuming backend returns { message: "File processed.", fileId: "...", fileName: "..." }

            fileStatusSpan.textContent = 'Processed';
            fileStatusSpan.classList.remove('text-sky-400');
            fileStatusSpan.classList.add('text-green-400');
            addMessageToChatbox(`Document "${result.fileName || file.name}" has been uploaded. ${result.message || ''}`, 'bot');

        } catch (error) {
            console.error('Error uploading file:', error);
            fileStatusSpan.textContent = 'Error';
            fileStatusSpan.classList.remove('text-sky-400');
            fileStatusSpan.classList.add('text-red-400');
            addMessageToChatbox(`Failed to upload "${file.name}": ${error.message}`, 'bot');
        }
    }
    fileInput.value = ''; // Reset file input to allow uploading the same file again if needed
} 