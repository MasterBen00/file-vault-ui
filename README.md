# File Sharing Platform

A modern, secure file sharing application built with Vue 3 and Vuetify, designed for seamless document collaboration and secure file management.

## 📋 Features

- **Secure File Uploads & Downloads**: Password-protected file sharing with optional expiration dates
- **Document Collaboration**: Real-time collaborative editing capabilities
- **Folder Management**: Organize files with an intuitive folder explorer
- **Multi-tenant Sharing**: Securely share content across organizations
- **QR Code Generation**: Quick access to shared files via generated QR codes
- **Comprehensive Admin Dashboard**: Monitor usage, manage users, and track system performance
- **User Authentication**: Secure registration, login, and email verification
- **Audit Logging**: Track all file and user activities for compliance purposes
- **Role-Based Access Control**: Granular permissions management
- **Email Notifications**: Customizable alerts for important events

## 🚀 Technologies Used

- **Frontend**: Vue 3, Vuetify 3, TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router with layout system
- **Real-time Communication**: SockJS and WebStomp
- **HTTP Client**: Axios
- **Document Editing**: Quill
- **Build Tool**: Vite

## 🔧 Getting Started

### Prerequisites

- Node.js (v16+)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/file-sharing-vuetify.git
cd file-sharing-vuetify
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Access the application at [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

- `/src/components` - Reusable Vue components
- `/src/layouts` - Application layout templates
- `/src/pages` - Vue components representing different routes
- `/src/services` - API services for backend communication
- `/src/stores` - Pinia stores for state management
- `/src/plugins` - Vue plugins and external library integrations
- `/public/api-docs` - API documentation for various controllers

## 🚢 Deployment

Build the application for production:

```bash
npm run build
# or
yarn build
```

The built files will be in the `/dist` directory, ready to be deployed to your preferred hosting platform.

## 📚 Documentation

API documentation is available in the `/public/api-docs` directory, covering all backend controllers and endpoints.

## 🛠️ Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request