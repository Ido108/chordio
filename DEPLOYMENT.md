# Chord Extractor Web Application - Deployment Guide

This guide will help you deploy the Chord Extractor web application to various hosting platforms. The application extracts chords from audio files and YouTube videos, then generates MIDI files with accurate timing that match the original song.

## Option 1: Deploy to Vercel (Recommended)

Vercel is the recommended platform as it fully supports Next.js applications with API routes, which are needed for YouTube processing and audio analysis.

### Prerequisites
- A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
- [Git](https://git-scm.com/downloads) installed on your computer
- [Node.js](https://nodejs.org/) (version 18 or later)

### Deployment Steps

1. **Create a Git Repository**
   - Create a new repository on GitHub, GitLab, or Bitbucket
   - Initialize a Git repository in the deployment package folder:
     ```bash
     cd deployment_package
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin YOUR_REPOSITORY_URL
     git push -u origin main
     ```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Import your Git repository
   - Vercel will automatically detect Next.js and configure the build settings
   - Click "Deploy"
   - Vercel will build and deploy your application
   - Once complete, you'll receive a URL to access your application

## Option 2: Deploy to Netlify

Netlify also supports Next.js applications with API routes.

### Prerequisites
- A [Netlify account](https://app.netlify.com/signup) (free tier is sufficient)
- Git repository (as described in Option 1)

### Deployment Steps

1. **Deploy to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect to your Git provider and select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy site"
   - Netlify will build and deploy your application
   - Once complete, you'll receive a URL to access your application

## Option 3: Deploy to Railway

Railway provides a simple platform for deploying full-stack applications.

### Prerequisites
- A [Railway account](https://railway.app/) (free tier available)

### Deployment Steps

1. **Deploy to Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" > "Deploy from GitHub"
   - Connect to your GitHub account and select your repository
   - Railway will automatically detect Next.js and configure the build settings
   - Click "Deploy"
   - Railway will build and deploy your application
   - Once complete, you'll receive a URL to access your application

## Running Locally

If you prefer to run the application locally before deploying:

1. **Install Dependencies**
   ```bash
   cd deployment_package
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`

## Troubleshooting

- **Build Errors**: If you encounter build errors, check the build logs on your hosting platform. Common issues include:
  - Missing dependencies: Make sure all dependencies are listed in package.json
  - Environment variables: Some platforms require setting environment variables for API keys

- **API Route Errors**: If YouTube processing doesn't work, ensure your hosting platform supports API routes and server-side functionality.

- **CORS Issues**: If you encounter CORS errors when processing YouTube videos, you may need to configure CORS headers in your API routes.

## Support

If you need further assistance with deployment, please refer to the documentation of your chosen hosting platform:

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)

## Features

Once deployed, your application will include:
- Audio file upload and processing
- YouTube link processing
- Chord detection with precise timing
- MIDI generation and playback
- Interactive audio visualization
- Chord progression display
