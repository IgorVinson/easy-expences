# Easy Expenses

React Native mobile expense tracker with Firebase auth and real-time sync.

<!-- Add screenshot here -->

## Overview

Easy Expenses is a mobile budgeting application built with React Native and Expo. It helps users track their daily expenses, manage budgets, and stay on top of their financial goals with a clean, intuitive interface and real-time data synchronization.

## Key Features

- **Cross-Platform**: Works on both iOS and Android devices
- **Real-Time Sync**: Expenses sync instantly across all devices via Firebase
- **Secure Authentication**: Email/password and social login via Firebase Auth
- **Expense Categories**: Organize spending with customizable categories
- **Budget Tracking**: Set monthly budgets and monitor progress
- **Spending Insights**: Visualize spending patterns over time
- **Offline Support**: Access and add expenses even without an internet connection
- **Native Performance**: Built with React Native for smooth, native-like experience

## Tech Stack

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator, or a physical device with Expo Go

### Installation

```bash
# Clone the repository
git clone https://github.com/IgorVinson/easy-expences.git
cd easy-expences

# Install dependencies
npm install

# Configure Firebase
# Edit firebaseConfig.js with your Firebase project credentials

# Start the development server
npm start
# or
expo start
```

## Environment Variables

Create a `firebaseConfig.js` file with your Firebase configuration:

```javascript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Project Structure

```
easy-expences/
├── app/                    # Expo Router app directory
├── components/             # Reusable UI components
├── contexts/               # React contexts (Auth, etc.)
├── hooks/                  # Custom React hooks
├── services/               # Firebase services
├── types/                  # TypeScript type definitions
├── firebaseConfig.js       # Firebase configuration
└── package.json
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android emulator/device
- `npm run ios` - Start on iOS simulator/device (Mac only)
- `npm run web` - Start the web version
- `npm run lint` - Run ESLint and Prettier checks
- `npm run format` - Auto-format code with ESLint and Prettier

## Firebase Setup

1. Create a new project in [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google sign-in)
3. Create a Firestore database in test mode
4. Add your app (iOS/Android) and download the config
5. Copy the configuration values to `firebaseConfig.js`

## License

MIT
