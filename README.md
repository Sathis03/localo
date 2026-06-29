# Localo - Deployment Instructions

This repository contains both the `frontend` and `backend` code for Localo.

---

## 🚀 How to Deploy Frontend on Vercel

Since the frontend is located in the `frontend` directory, you can deploy it on Vercel:

1. Go to the **Vercel Dashboard** and click **Add New** > **Project**.
2. Import this Git repository.
3. In the configuration step:
   - **Project Name:** `localo-frontend` (or your preferred name)
   - **Root Directory:** Select or type `frontend`
   - **Framework Preset:** Select **Vite** (Vercel should auto-detect this)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add any frontend environment variables (e.g. `VITE_API_URL` pointing to your deployed backend URL).
5. Click **Deploy**.

---

## 🚀 How to Deploy Backend on Render

Render is an excellent hosting platform for persistent Express/Node.js servers. To deploy the backend:

1. Go to the **[Render Dashboard](https://dashboard.render.com/)** and click **New** > **Web Service**.
2. Connect your Git provider and select this repository.
3. In the configuration page, set the following values:
   - **Name:** `localo-backend` (or your preferred name)
   - **Region:** Choose the region closest to your users.
   - **Branch:** `main` (or your active branch)
   - **Root Directory:** `backend`
   
   **Option A: Using Docker (Automatically Detected)**
   - Render will detect the `Dockerfile` and automatically select **Docker** as the Runtime.
   - You don't need to specify Build/Start commands; Render will use the multi-stage Dockerfile.
   
   **Option B: Using Node**
   - Switch the **Runtime** dropdown to **Node** (instead of Docker).
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   
4. Choose the **Free** instance type (or any preferred tier).
5. Click **Advanced** and add your **Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Connection String (e.g., MongoDB Atlas connection URL)
   - `JWT_SECRET`: Your secure custom JWT secret key
   - `JWT_REFRESH_SECRET`: Your secure custom refresh JWT secret key
   - `REDIS_URL`: Your production Redis connection URL
   - Add any other secrets or variables from `backend/.env.example`.
6. Click **Create Web Service**.
