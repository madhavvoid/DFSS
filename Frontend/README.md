# DFSS Frontend

The file workspace opens in browser-storage mode so uploads and folders work without a server. Files in this mode are saved in this browser on this device using IndexedDB; they are not sent to the DFSS backend or copied to Google Drive.

## Source layout

- `src/App.jsx` is the application entry point.
- `src/Components/WorkspacePage.jsx` owns workspace state and connects the UI to services.
- `src/Components/` contains the header, sidebar, file list, icons, and focused dialogs. `DriveWorkspace.css` holds the workspace styles.
- `src/services/browserStorage.js` handles IndexedDB; `googleDrive.js` handles Drive files; `googleAuth.js` handles Google sign-in; `storageService.js` routes between storage providers.
- `src/utils/fileUtils.js` contains shared file formatting and download helpers.
- `public/tpcm-vault-mark.svg` is the TPCM Vault logo and favicon.

## Google Drive

To connect a Google account and store files in its Drive:

1. Create a Google Cloud project, enable the Google Drive API, and configure an OAuth client for a web application.
2. Add the development origin (normally `http://localhost:5173`) and any deployed frontend origin to the OAuth client's authorized JavaScript origins.
3. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID` to the OAuth client ID.
4. Restart the Vite development server, then use **Log in** or **Sign up** and choose **Continue with Google**.

Google sign-in and Drive API requests run in the browser. DFSS requests the `drive.file` scope, which limits access to files created or opened by this app. The access token is kept in memory; reconnect after refreshing the page. Do not put a Google client secret in frontend code or environment variables.

The frontend can use Google Drive directly and does not require backend changes. Google OAuth must be configured by the owner of the Google Cloud project before account connection can work.

## Development

```sh
npm ci
npm run dev
```

Build and lint with `npm run build` and `npm run lint`.