# School Fees Management System (Offline)

A desktop application for managing school fees, built with Electron and SQLite.

## Features

- One-time school setup
- Dashboard with key statistics
- Manage academic sessions
- Manage transport routes
- Manage student fees
- Manage student records
- Offline-first functionality

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd school-fees-offline
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Development

The application is structured as follows:

```
src/
├── main/           # Main process files
│   ├── main.js     # Electron main process
│   └── database.js # SQLite database operations
└── renderer/       # Renderer process files
    └── index.html  # Main UI and renderer logic
```

## Database Schema

The application uses SQLite with the following tables:

- `school`: Single row containing school information
- `sessions`: Academic sessions
- `routes`: Transport routes
- `fee_types`: Types of fees
- `students`: Student records
- `student_fees`: Student fee records

## License

ISC 