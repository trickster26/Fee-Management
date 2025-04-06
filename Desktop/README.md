# School Management System

A desktop application built with Electron for managing school-related data, including:

- Academic sessions
- Fee types and payments
- Transport routes
- Student information

## Features

- Modern and intuitive UI
- Dark/light theme toggle
- Dashboard with key stats
- CRUD operations for sessions, fee types, routes, and students
- Data persistence with SQLite database
- Offline-first approach

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (included with Node.js)

## Installation

1. Clone this repository or download the source code
2. Navigate to the project directory in your terminal/command prompt
3. Install the dependencies:

```bash
npm install
```

## Running the Application

To start the application in development mode:

```bash
npm start
```

## Application Structure

- `/src/main` - Main process code
  - `main.js` - Entry point
  - `database.js` - Database operations
- `/src/renderer` - Renderer process code
  - `index.html` - Main UI
  - `renderer.js` - UI logic
  - `/assets` - Styles and images
- `/src/utils` - Shared utilities
- `/db` - Database files

## First-time Setup

When you first run the application, you'll be prompted to set up your school:

1. Enter your school name
2. Provide the location
3. Select the month when your academic session starts
4. Click "Set Up School"

After the initial setup, you'll be taken to the dashboard where you can start managing your school data.

## Database

The application uses SQLite for data storage. The database file is stored in the `/db` directory.

## License

MIT 