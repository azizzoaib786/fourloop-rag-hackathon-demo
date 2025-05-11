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

// Utility: Format message with sales-friendly styling
function formatSalesMessage(message) {
    // Format key specs and highlights
    function formatSpecs(text) {
        return text
            // Bold prices and key numbers
            .replace(/(?:AED|USD|EUR)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '**$1**')
            // Bold key specs
            .replace(/(\d+(?:\.\d+)?\s*(?:L|kW|hp|mpg|km|miles|year|seats))/gi, '**$1**')
            // Add emojis for stock status
            .replace(/in stock/gi, '✅')
            .replace(/out of stock/gi, '⚠️')
            // Add emojis for key features
            .replace(/hybrid/gi, '⚡')
            .replace(/electric/gi, '🔌')
            .replace(/premium/gi, '✨')
            .replace(/warranty/gi, '🛡️');
    }

    // Add concise call-to-action phrases
    const ctas = [
        "Want details?",
        "Check availability?",
        "See more options?",
        "Compare models?",
        "Filter by feature?"
    ];

    // If message is a header or very short, return as is
    if (message.length < 50 || message.endsWith(':')) {
        return message;
    }

    // Format the message
    let formatted = message;
    
    // Format specs and highlights
    formatted = formatSpecs(formatted);

    // Add CTA if it's the last message in a sequence
    if (!formatted.includes('?') && !formatted.includes('Want') && !formatted.includes('Need')) {
        formatted += `\n\n${ctas[Math.floor(Math.random() * ctas.length)]}`;
    }

    return formatted;
}

// Utility: Generate contextual follow-up questions
function getFollowUpQuestion(context, lastMessage) {
    const followUps = {
        price: [
            "Should I filter for cars under **260K**?",
            "Want to see options in a different price range?",
            "Would you like to compare with similar models?"
        ],
        type: [
            "Are you leaning toward petrol or hybrid?",
            "Prefer SUV or sedan?",
            "Need more seats or better fuel economy?"
        ],
        features: [
            "Any specific features you're looking for?",
            "Color preference?",
            "Need premium features or standard trim?"
        ],
        general: [
            "Ready to explore some cars?",
            "Want to check inventory or search documents?",
            "Need help finding something specific?"
        ]
    };

    // Detect context from last message
    if (lastMessage.toLowerCase().includes('price') || /\d+[k]/.test(lastMessage)) {
        return followUps.price[Math.floor(Math.random() * followUps.price.length)];
    }
    if (lastMessage.toLowerCase().includes('model') || lastMessage.toLowerCase().includes('type')) {
        return followUps.type[Math.floor(Math.random() * followUps.type.length)];
    }
    if (lastMessage.toLowerCase().includes('feature') || lastMessage.toLowerCase().includes('spec')) {
        return followUps.features[Math.floor(Math.random() * followUps.features.length)];
    }
    return followUps.general[Math.floor(Math.random() * followUps.general.length)];
}

// Utility: Handle casual greetings and small talk
function handleCasualInput(message) {
    const casualResponses = [
        "Hey! Ready to explore some cars or upload a doc?",
        "Just here to help. Want to check inventory or search documents?",
        "Hi there! Looking for a specific model or need help with something?",
        "Hello! I can help you find cars or analyze documents. What would you like to do?"
    ];
    
    const casualPatterns = [
        /^(hi|hey|hello|sup|what's up|howdy)/i,
        /^(how are you|how's it going|how's everything)/i,
        /^(thanks|thank you|thx)/i,
        /^(bye|goodbye|see you)/i
    ];
    
    return casualPatterns.some(pattern => pattern.test(message)) 
        ? casualResponses[Math.floor(Math.random() * casualResponses.length)]
        : null;
}

// Utility: Split bot response into natural message components
function splitBotResponse(response) {
    // Check for casual input first
    const casualResponse = handleCasualInput(response);
    if (casualResponse) {
        return [casualResponse];
    }

    // Normalize line endings and clean up whitespace
    response = response.replace(/\r\n/g, '\n').trim();
    
    const messages = [];
    let currentMessage = [];
    let inList = false;
    let listItems = [];
    let listCount = 0;
    let totalItems = 0;
    
    // Split into lines for processing
    const lines = response.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) {
            if (currentMessage.length > 0) {
                messages.push(currentMessage.join(' '));
                currentMessage = [];
            }
            if (listItems.length > 0) {
                // Only add first 3 items, then add a follow-up
                if (totalItems <= 3) {
                    messages.push(listItems.join('\n'));
                } else {
                    messages.push(listItems.slice(0, 3).join('\n'));
                    messages.push("Want to see more options?");
                }
                listItems = [];
                listCount = 0;
            }
            inList = false;
            continue;
        }
        
        // Check for headers
        const isHeader = (line.length < 50 && (line.endsWith(':') || /^[A-Z\s]+$/.test(line)));
        
        // Check if line starts a list
        const isListStart = /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line);
        
        if (isHeader) {
            // Flush existing content
            if (currentMessage.length > 0) {
                messages.push(currentMessage.join(' '));
                currentMessage = [];
            }
            if (listItems.length > 0) {
                if (totalItems <= 3) {
                    messages.push(listItems.join('\n'));
                } else {
                    messages.push(listItems.slice(0, 3).join('\n'));
                    messages.push("Want to see more options?");
                }
                listItems = [];
                listCount = 0;
            }
            messages.push(line);
            inList = false;
        } else if (isListStart) {
            if (currentMessage.length > 0) {
                messages.push(currentMessage.join(' '));
                currentMessage = [];
            }
            inList = true;
            listItems.push(line);
            listCount++;
            totalItems++;
            
            // Limit to 3 items per message
            if (listCount >= 3) {
                messages.push(listItems.join('\n'));
                listItems = [];
                listCount = 0;
            }
        } else if (inList) {
            listItems.push(line);
            listCount++;
            totalItems++;
            
            if (listCount >= 3) {
                messages.push(listItems.join('\n'));
                listItems = [];
                listCount = 0;
            }
        } else {
            const sentences = line.match(/[^.!?]+[.!?]+/g) || [line];
            sentences.forEach(sentence => {
                const trimmed = sentence.trim();
                if (trimmed) {
                    if (currentMessage.join(' ').length + trimmed.length > 100) {
                        messages.push(currentMessage.join(' '));
                        currentMessage = [];
                    }
                    currentMessage.push(trimmed);
                    if (trimmed.endsWith('.') || trimmed.endsWith('!') || trimmed.endsWith('?')) {
                        messages.push(currentMessage.join(' '));
                        currentMessage = [];
                    }
                }
            });
        }
    }
    
    // Add remaining content
    if (currentMessage.length > 0) {
        messages.push(currentMessage.join(' '));
    }
    if (listItems.length > 0) {
        if (totalItems <= 3) {
            messages.push(listItems.join('\n'));
        } else {
            messages.push(listItems.slice(0, 3).join('\n'));
            messages.push("Want to see more options?");
        }
    }
    
    // Format messages and add follow-up questions
    const formattedMessages = messages
        .map(msg => msg.trim())
        .filter(msg => msg.length > 0)
        .map(formatSalesMessage);

    // Add contextual follow-up if we have at least one message
    if (formattedMessages.length > 0) {
        const lastMessage = formattedMessages[formattedMessages.length - 1];
        const followUp = getFollowUpQuestion('general', lastMessage);
        if (followUp) {
            formattedMessages.push(followUp);
        }
    }
    
    return formattedMessages;
}

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
        
        // Remove initial typing indicator
        typingIndicator.classList.add('hidden');
        typingIndicator.classList.remove('flex');
        
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

        // Split and render each message with typing effect
        const messages = splitBotResponse(replyText);
        console.log('Split messages:', messages); // Debug log
        
        for (let i = 0; i < messages.length; i++) {
            // Show typing indicator
            typingIndicator.classList.remove('hidden');
            typingIndicator.classList.add('flex');
            
            // Calculate typing delay based on message length (300-500ms)
            const typingDelay = Math.min(500, Math.max(300, messages[i].length * 10));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            
            // Hide typing indicator
            typingIndicator.classList.add('hidden');
            typingIndicator.classList.remove('flex');
            
            // Add the message
            addMessageToChatbox(messages[i], 'bot', true);
            
            // Add a small pause between messages
            if (i < messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Handle sources if present
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

    } catch (error) {
        console.error('Error sending message or fetching response:', error);
        addMessageToChatbox(`Sorry, I encountered an error: ${error.message}. Please check the console or try again.`, 'bot');
    } finally {
        typingIndicator.classList.add('hidden');
        typingIndicator.classList.remove('flex');
    }
}

// Update addMessageToChatbox to preserve formatting for bot messages
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
            // Render basic formatting: bold, bullets, numbered lists, line breaks
            const formatted = formatBotMessage(message);
            messageElement.appendChild(formatted);
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

// Helper: Format bot message preserving basic markdown-like formatting
function formatBotMessage(text) {
    // Create a container for the message
    const container = document.createElement('div');
    container.classList.add('text-sm', 'sm:text-base', 'break-words');

    // Handle markdown-style formatting
    let html = text
        // Convert bold markdown to HTML
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert line breaks to <br>
        .replace(/\n/g, '<br>');

    // Check if the message contains a list
    if (html.includes('<br>') && (html.includes('- ') || html.includes('* ') || html.includes('• ') || /^\d+\.\s/.test(html))) {
        // Create a list container
        const listContainer = document.createElement('div');
        listContainer.classList.add('mt-2');

        // Split into lines and process each line
        const lines = html.split('<br>');
        let currentList = null;

        lines.forEach(line => {
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ') || /^\d+\.\s/.test(line.trim())) {
                // Start a new list if needed
                if (!currentList) {
                    currentList = document.createElement('ul');
                    currentList.classList.add('list-disc', 'ml-4', 'mt-1');
                    listContainer.appendChild(currentList);
                }
                // Add list item
                const li = document.createElement('li');
                li.innerHTML = line.replace(/^[-*•]\s+|\d+\.\s+/, '');
                currentList.appendChild(li);
            } else {
                // Regular text
                if (currentList) {
                    container.appendChild(listContainer);
                    currentList = null;
                }
                const p = document.createElement('p');
                p.innerHTML = line;
                container.appendChild(p);
            }
        });

        // Add any remaining list
        if (currentList) {
            container.appendChild(listContainer);
        }
    } else {
        // Regular text with line breaks
        const p = document.createElement('p');
        p.innerHTML = html;
        container.appendChild(p);
    }

    return container;
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