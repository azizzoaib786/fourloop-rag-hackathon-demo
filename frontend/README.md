# Automotive AI Assistant

A web-based AI assistant for automotive inventory management, featuring a chat interface and document upload capabilities.

## Features

- Real-time chat interface with AI assistant
- Document upload and processing (PDF, CSV, Excel)
- Integration with inventory database and CRM systems
- Modern, responsive UI built with Tailwind CSS
- File upload management
- Real-time typing indicators
- Message history with timestamps

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd automotive-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create an uploads directory:
```bash
mkdir uploads
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

- `POST /api/chat`: Chat endpoint for sending messages to the AI assistant
- `POST /api/upload`: File upload endpoint for processing documents

## Development

The application consists of:
- Frontend: HTML, CSS (with Tailwind), and JavaScript
- Backend: Node.js with Express
- File handling: Multer for file uploads

## Customization

- Update the API endpoints in `app.js` to point to your actual backend services
- Modify the chat logic in `server.js` to integrate with your AI service
- Customize the UI by modifying the Tailwind classes in `index.html`

## License

MIT License 