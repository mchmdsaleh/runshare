# RunShare

RunShare is a web app for turning running activity files into clean, shareable visual cards and captions.

It supports direct import of `.fit` and `.csv` activity files, and it can also fetch the latest running activity from Garmin Connect through the backend.

## What It Does

- Upload and parse:
  - Garmin-style `.csv`
  - `.fit` activity files
- Fetch the latest running activity from Garmin Connect
- Review and edit parsed split rows before export
- Export multiple templates:
  - `Minimal Overlay`
  - `Split`
  - `Classic Summary`
- Render route data for FIT files that contain GPS records
- Support interval controls:
  - Include Warm Up
  - Include Cool Down
  - Include Rest
- Generate text outputs:
  - Clean
  - Coach Mode
  - Social Caption
- Export images:
  - Story (`1080x1920`)
  - Square (`1080x1080`)
  - Custom dimensions
- Copy caption text and PNG output

## Repository Layout

```text
runshare/
  src/                  # Frontend React app
runshare-api/           # FastAPI backend
GarminDB/               # Garmin Connect download/import helper library
```

## Architecture

The app is split into two parts:

- Frontend: React + Vite
- Backend: FastAPI

The frontend talks to the backend over HTTP. By default, the frontend expects the API at `http://localhost:8000`, but this can be changed with `VITE_API_BASE_URL`.

Garmin credentials are encrypted before being stored in the database. Raw `.fit` files are kept in temporary storage only and are not stored in the database.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- Python 3.10+ recommended
- A Garmin account if you want to load activities from Garmin Connect

## Environment Variables

### Backend

Create `runshare-api/.env` with values like:

```env
SECRET_KEY=replace-me
ENCRYPTION_KEY=replace-me-with-a-fernet-key
DATABASE_URL=sqlite:///./runshare.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

- `SECRET_KEY` is used for JWT auth.
- `ENCRYPTION_KEY` is used to encrypt Garmin email/password at rest.
- `DATABASE_URL` can stay as SQLite for local development.
- `CORS_ORIGINS` is optional and can include extra frontend origins.

### Frontend

Create `runshare/.env` if your backend is not on `localhost:8000`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If you deploy the backend on a remote domain, set this to that backend URL.

## Run Locally

### 1) Start the backend

```bash
cd runshare-api
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

If you are setting up a fresh environment, create and install the Python dependencies first using the package manager available in your setup.

The backend will be available at:

- `http://localhost:8000`

### 2) Start the frontend

```bash
cd runshare
npm install
npm run dev -- --host 0.0.0.0 --port 4173
```

Open:

- `http://localhost:4173`

### 3) Use the app

1. Register or log in.
2. Open the Garmin Connect section.
3. Click `Setup Garmin Account` once to save your Garmin email/password.
4. Click `Load Latest Activity` to fetch the latest running activity from Garmin Connect.
5. Review or export the generated output.

## Production Deployment

There are two common ways to deploy RunShare.

### Option 1: Deploy frontend and backend on the same server

This is the simplest setup for a VPS.

1. Build the frontend:

   ```bash
   cd runshare
   npm install
   npm run build
   ```

2. Run the backend with a process manager such as `systemd`, `pm2` for node-based wrappers, or a shell service that launches:

   ```bash
   cd runshare-api
   source .venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

3. Put Nginx or another reverse proxy in front of the app.

4. Serve the frontend build output from your static host or from the reverse proxy.

5. Set these production env vars:
   - `SECRET_KEY`
   - `ENCRYPTION_KEY`
   - `DATABASE_URL`
   - `CORS_ORIGINS`
   - `VITE_API_BASE_URL`

### Option 2: Split frontend and backend

This is useful if you want the frontend on Vercel/Netlify and the backend on a VPS.

1. Deploy the backend first.
2. Set `VITE_API_BASE_URL` in the frontend to the public backend URL.
3. Add the frontend domain to `CORS_ORIGINS`.
4. Rebuild and redeploy the frontend.

## Suggested Production Checklist

- Use a strong, random `SECRET_KEY`
- Use a strong, random `ENCRYPTION_KEY`
- Keep `.env` out of version control
- Use HTTPS in production
- Back up the SQLite database if you stay on SQLite
- Keep the backend and frontend origins aligned with CORS

## Garmin Security Model

- Garmin email and password are encrypted before being written to the database.
- The frontend never reads the decrypted value back from the API.
- The backend decrypts the credential only in memory when it needs to talk to Garmin Connect.
- Raw `.fit` files are fetched into temporary storage only.

Important note:

- This protects credentials at rest.
- It does not make recovery mathematically impossible if the server runtime and encryption key are both compromised.

## Troubleshooting

### `CORS Missing Allow Origin`

- Check that the frontend origin is listed in `CORS_ORIGINS`.
- Check that the frontend is using the right `VITE_API_BASE_URL`.
- Restart the backend after changing env vars.

### `401 Unauthorized` during login

- The JWT token may have expired.
- Log out and log in again.

### `Sync failed: [Errno 32] Broken pipe`

- Make sure the backend was restarted after the GarminDB logging fixes.
- Try again after a fresh backend start.

### No activity found

- The current flow only fetches running activities.
- If Garmin does not have a recent running activity, the app will return `404`.

## Development Notes

- The frontend is built with React + Vite.
- The backend uses FastAPI and SQLite by default.
- The Garmin flow uses a third-party Garmin Connect wrapper library, not an official public personal API.
- The latest activity flow downloads the newest running `.fit` file into temporary storage, then hands that file to the frontend for parsing.

## License

This repository currently has no explicit license file. Add one before public distribution.
