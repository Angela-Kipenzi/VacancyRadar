
  # Landlord Web Dashboard

  ## Running the code

  Run `npm i` to install dependencies in each app (`landlord-backend`, `landlord-frontend`, `mobile`).

  Run `npm run dev` from each app you want to start.

  ## M-Pesa setup (backend)

  Add these variables to `landlord-backend/.env`:

  - `MPESA_ENABLED=true`
  - `MPESA_ENV=sandbox` (or `production`)
  - `MPESA_CONSUMER_KEY=...`
  - `MPESA_CONSUMER_SECRET=...`
  - `MPESA_SHORTCODE=...`
  - `MPESA_PASSKEY=...`
  - `MPESA_CALLBACK_URL=https://<public-domain>/api/payments/mpesa/callback`
  - `MPESA_TRANSACTION_TYPE=CustomerPayBillOnline` (optional)
  - `MPESA_ACCOUNT_REFERENCE=Rent Payment` (optional)

  Run backend migration after pulling changes:

  - `cd landlord-backend`
  - `npm run migrate`
  
