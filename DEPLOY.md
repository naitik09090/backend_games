# Vercel Deployment Steps

## Step 1: Login to Vercel
vercel login
# This will open a browser window - complete the authentication

## Step 2: Navigate to server directory
cd server

## Step 3: Deploy to production
vercel --prod

## Step 4: Verify deployment
# Visit: https://game-backend-pi.vercel.app/games
# Should show your games data

## If you need to add environment variables via CLI:
# vercel env add MONGODBCON production
# When prompted, paste: mongodb+srv://raiyaninaitik980_db_user:Naitik.41105@cluster0.wve56pf.mongodb.net/games
