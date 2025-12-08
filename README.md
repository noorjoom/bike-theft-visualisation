# Berlin Bike Theft Visualizer

A web application that visualizes stolen bike data in Berlin on an interactive map, powered by PostgreSQL for scalable data storage.

## Features

- 🗺️ Interactive map visualization with clustering
- 📊 Analytics charts (time of day, bike types, top districts)
- 🗄️ PostgreSQL database backend for scalability
- 🚀 RESTful API for data access
- 📈 Real-time statistics

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL 15
- npm or yarn

## Setup Instructions

### 1. Install PostgreSQL 15

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Configure Database

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bike_theft_db
DB_USER=postgres
DB_PASSWORD=your_password_here

PORT=3000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Database Schema

This will create the database and tables:

```bash
npm run setup-db
```

### 5. Import CSV Data

Import your bike theft CSV data into the database:

```bash
npm run import
```

Or specify a custom CSV file path:

```bash
node scripts/import-csv.js path/to/your/bike.csv
```

### 6. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
bike-data/
├── index.html          # Frontend application
├── server.js           # Express.js backend server
├── package.json        # Node.js dependencies
├── .env                # Environment variables (create from .env.example)
├── scripts/
│   ├── setup-database.js  # Database schema setup
│   └── import-csv.js      # CSV import script
└── bike.csv            # Sample data file
```

## API Endpoints

### GET `/api/thefts`
Fetch bike theft records with optional filters.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 10000)
- `startDate` - Filter by start date (YYYY-MM-DD)
- `endDate` - Filter by end date (YYYY-MM-DD)
- `district` - Filter by district code (first 2 digits of LOR)
- `bikeType` - Filter by bike type
- `minDamage` - Minimum damage amount
- `maxDamage` - Maximum damage amount

**Example:**
```
GET /api/thefts?limit=100&startDate=2024-01-01&bikeType=Mountainbike
```

### GET `/api/stats`
Get aggregated statistics about bike thefts.

### GET `/api/bike-types`
Get list of unique bike types in the database.

### GET `/api/health`
Health check endpoint to verify database connection.

## Database Schema

The `bike_thefts` table includes:

- `id` - Primary key
- `angelegt_am` - Date record was created
- `tatzzeit_anfang_datum` - Theft start date
- `tatzzeit_anfang_stunde` - Theft start hour
- `tatzzeit_ende_datum` - Theft end date
- `tatzzeit_ende_stunde` - Theft end hour
- `lor` - Location code (Berlin district identifier)
- `schadenshoehe` - Damage amount in euros
- `versuch` - Attempt status
- `art_des_fahrrads` - Type of bicycle
- `delikt` - Type of crime
- `erfassungsgrund` - Recording reason
- `created_at` - Record creation timestamp

Indexes are created on `lor`, `tatzzeit_anfang_datum`, `art_des_fahrrads`, and `tatzzeit_anfang_stunde` for optimal query performance.

## Development

### Adding New Features

The backend uses Express.js and can be extended with additional routes in `server.js`. The frontend is a single-page application in `index.html` using vanilla JavaScript.

### Database Migrations

For production use, consider using a migration tool like `node-pg-migrate` or `knex.js` for managing schema changes.

## Troubleshooting

**Database connection errors:**
- Verify PostgreSQL is running: `pg_isready` or `brew services list`
- Check `.env` file has correct credentials
- Ensure database exists: `psql -U postgres -l`

**Import errors:**
- Verify CSV file encoding (should be ISO-8859-1 or UTF-8)
- Check CSV column names match expected format
- Ensure database schema is set up first

**Port already in use:**
- Change `PORT` in `.env` file
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`

## License

ISC
