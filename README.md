# BBC City Park – Parking charge notice

Next.js app: enter vehicle + apartment number -> email goes to the resident (from `data/residents.xlsx`) with the association copied.

## Database (Neon Postgres)
Residents live in Postgres. One-time setup after adding Neon and putting `DATABASE_URL` in `.env.local`:

    npm run setup

This creates the tables and imports `data/residents.xlsx`. Later edits to residents are done in the Neon dashboard.

## Monthly report
Open `/report`, enter `REPORT_CODE`, pick a month, then Show report or Download Excel.

## Excel file (used only for the first import)
`data/residents.xlsx`, first sheet, columns: **Apartment | Resident Name | Email**.
To update residents, replace the file, commit and push; Vercel redeploys.

## Run locally
    npm install
    cp .env.example .env.local   # fill in values
    npm run dev

## Deploy on Vercel
1. Push this folder to a GitHub repo.
2. Vercel -> Add New Project -> import the repo.
3. Project Settings -> Environment Variables: add every variable from `.env.example`.
4. Deploy.

Gmail: turn on 2-step verification, create an App Password, use it as SMTP_PASS.
