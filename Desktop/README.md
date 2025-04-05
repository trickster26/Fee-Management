# SchoolFeesOffline

A desktop application for managing school fees without requiring an internet connection. Built with Electron and SQLite.

## Features

### School Management
- One-time school setup with name, location, and academic session start month
- Web token generation for future web integration
- Automatic session management based on the school's start month

### Dashboard
- Key statistics including active session, total students, and pending fees
- Quick navigation to all main features

### Session Management
- Automatic session creation based on start month
- Session history tracking
- Active/inactive session status

### Fee Management
- Define fee types (tuition, transport, etc.)
- Set fee amounts and specify recurring/one-time status
- Track fee payments and due dates

### Transport Routes
- Add and manage transport routes
- Set route distances and base fees
- Assign routes to students

### Student Management
- Add/edit student details with admission numbers
- Assign transport routes to students
- Track fee payments and payment history
- Manage student-specific fees

## Database Schema

The application uses SQLite for data storage with the following schema:

- **school**: Basic info, session settings, web token (single row)
- **sessions**: Academic sessions with start/end dates and active status
- **fee_types**: Fee categories, amounts, and recurring status
- **routes**: Route details, distances, and base fees
- **students**: Student information and route assignments
- **student_fees**: Fee assignments, payment status, and due dates

## Getting Started

### Prerequisites
- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or download the source code
   ```
   git clone https://github.com/yourusername/school-fees-offline.git
   cd school-fees-offline
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the application
   ```
   npm start
   ```

## Usage

1. On first launch, complete the school setup form with your school's details
2. Save your web token securely for future web integration
3. Use the dashboard to navigate to different sections of the application:
   - Manage Sessions: View and add academic sessions
   - Manage Fees: Define fee types and amounts
   - Manage Routes: Set up transport routes
   - Manage Students: Add students and assign routes
   - Student Fees: Manage individual student fees and payment status

## Development

### Project Structure
- `src/main/` - Electron main process code
   - `main.js` - Main application entry point
   - `database.js` - Database operations and schema
- `src/renderer/` - Frontend UI
   - `index.html` - Main application UI
   - `renderer.js` - Frontend JavaScript
   - `assets/` - CSS and other assets
- `db/` - SQLite database storage

## License

This project is licensed under the MIT License.

## Contributing

Contributions, issues, and feature requests are welcome!

## Roadmap

- Export/import functionality for data backup
- Reports and printable receipts
- Web synchronization using the generated web token 