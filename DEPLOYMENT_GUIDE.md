# 🚀 Talkative Chat Application — Free Deployment Guide

This guide provides a **100% free, step-by-step walkthrough** to deploy the **Talkative Chat Application** live on the web using:
- **MongoDB Atlas** (Database)
- **Cloudinary** (Media / Image Storage)
- **Render** (Backend API + WebSockets)
- **Vercel** (Frontend React App)

---

## 🛠️ Step 1: Set Up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Click **Create a Deployment** and select the **Free M0 Cluster**.
3. Create a **Database User** (e.g., username `talkative_user` and password `YourStrongPassword123`).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** → **Drivers** and copy your MongoDB connection string. It will look like:
   ```env
   mongodb+srv://talkative_user:<password>@cluster0.mongodb.net/talkative_db?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual database password).*

---

## 🖼️ Step 2: Set Up Cloudinary (Media Hosting)

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account.
2. From your **Dashboard**, copy these credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## 🖥️ Step 3: Deploy Backend on Render

1. Push your code repository to **GitHub**.
2. Sign up / log in at [Render](https://render.com/).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `talkative-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Select **Free**
6. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `PORT` | `8000` |
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | `mongodb+srv://...` *(From Step 1)* |
   | `JWT_SECRET` | `your_secret_key_here` |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` *(Update after Step 4)* |
   | `CLOUDINARY_CLOUD_NAME` | *(From Step 2)* |
   | `CLOUDINARY_API_KEY` | *(From Step 2)* |
   | `CLOUDINARY_API_SECRET` | *(From Step 2)* |

7. Click **Create Web Service**. Wait for the build to finish. Copy your backend URL (e.g. `https://talkative-backend.onrender.com`).

---

## 🌐 Step 4: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/) with GitHub.
2. Click **Add New** → **Project** and select your repository.
3. Configure the deployment settings:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
4. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `REACT_APP_API_URL` | `https://talkative-backend.onrender.com` *(Your Render backend URL)* |

5. Click **Deploy**.
6. Once deployed, copy your live Vercel domain URL (e.g., `https://talkative-chat-application-ten.vercel.app`).

---

## 🔄 Step 5: Final Cross-Origin Sync

1. Return to **Render** → Your `talkative-backend` service → **Environment**.
2. Ensure `FRONTEND_URL` is updated to your exact live Vercel URL:
   `https://talkative-chat-application-ten.vercel.app`
3. Click **Save Changes** (Render will automatically redeploy).

---

## ✅ Deployment Checklist & Testing

- [x] Test registration and OTP verification.
- [x] Test sending real-time messages between two browsers.
- [x] Test image/video attachments upload to Cloudinary.
- [x] Test dark/light theme toggle & contact profile viewer.

🎉 **Your Talkative Chat Application is live on the web!**
