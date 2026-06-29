# Localo - Vercel Deployment Instructions

This repository contains both the `frontend` and `backend` code for Localo under the `Localo` directory.

We have configured `vercel.json` files for both frontend and backend to enable seamless Vercel deployment.

---

## 🚀 How to Deploy on Vercel

Since both components live in the same Git repository under `Localo/frontend` and `Localo/backend`, you can deploy them as **two separate projects** in the Vercel Dashboard.

### 1. Frontend Deployment

1. Go to the **Vercel Dashboard** and click **Add New** > **Project**.
2. Import this Git repository.
3. In the configuration step:
   - **Project Name:** `localo-frontend` (or your preferred name)
   - **Root Directory:** Edit this and select/type `Localo/frontend`
   - **Framework Preset:** Select **Vite** (Vercel should auto-detect this)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add any frontend environment variables (e.g. `VITE_API_URL` pointing to your deployed backend URL).
5. Click **Deploy**.

### 2. Backend Deployment

1. Go to the **Vercel Dashboard** and click **Add New** > **Project**.
2. Import this Git repository again.
3. In the configuration step:
   - **Project Name:** `localo-backend` (or your preferred name)
   - **Root Directory:** Edit this and select/type `Localo/backend`
   - **Framework Preset:** Select **Other** (since it's a Node/Express app)
   - **Build Command:** Leave blank (or `npm run build` if you have build steps)
   - **Output Directory:** Leave blank
4. Expand **Environment Variables** and add the required environment variables:
   - `MONGODB_URI`: Your MongoDB Connection String (e.g., MongoDB Atlas URL)
   - `PORT`: `5000` (optional, default fallback is handled)
   - Any other keys from `Localo/backend/.env.example`
5. Click **Deploy**.

---

## 🚀 How to Deploy Backend on Render

Render is an excellent hosting platform for persistent Express/Node.js servers. To deploy the backend on Render:

1. Go to the **[Render Dashboard](https://dashboard.render.com/)** and click **New** > **Web Service**.
2. Connect your Git provider and select this repository.
3. In the configuration page, set the following values:
   - **Name:** `localo-backend` (or your preferred name)
   - **Region:** Choose the region closest to your users.
   - **Branch:** `main` (or your active branch)
   - **Root Directory:** `Localo/backend`
   
   **Option A: Using Docker (Automatically Detected)**
   - Render will detect the `Dockerfile` and automatically select **Docker** as the Runtime.
   - You don't need to specify Build/Start commands; Render will use the multi-stage Dockerfile.
   
   **Option B: Using Node**
   - Switch the **Runtime** dropdown to **Node** (instead of Docker).
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   
4. Choose the **Free** instance type (or any preferred tier).
5. Click **Advanced** and add your **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Connection String (e.g. MongoDB Atlas connection URL)
   - `PORT`: `5000` (Render will automatically bind to the port you specify here, or inject its own `PORT` which our app automatically handles)
   - Add any other secrets or variables from `Localo/backend/.env.example`.
6. Click **Create Web Service**.

---

## 🛠️ Configuration Details Added

- **Backend Vercel Config:** Created [vercel.json](file:///c:/sathish/Localo/Localo/backend/vercel.json) and a serverless-friendly entrypoint [vercel.ts](file:///c:/sathish/Localo/Localo/backend/src/vercel.ts) that caches the MongoDB connection pool across serverless lambda invocations to avoid connection limits.
- **Frontend Vercel Config:** Created [vercel.json](file:///c:/sathish/Localo/Localo/frontend/vercel.json) to handle Single Page App (SPA) route rewrites so that page refreshes on sub-routes work correctly.

