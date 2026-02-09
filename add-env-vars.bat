@echo off
echo Adding environment variables to Vercel...
echo.

REM Navigate to the server directory
cd /d "%~dp0"

echo Step 1: Linking to Vercel project...
vercel link

echo.
echo Step 2: Adding MONGODBCON environment variable...
echo mongodb+srv://raiyaninaitik980_db_user:Naitik.41105@cluster0.wve56pf.mongodb.net/games | vercel env add MONGODBCON production

echo.
echo Step 3: Adding MONGODBCON to preview environment...
echo mongodb+srv://raiyaninaitik980_db_user:Naitik.41105@cluster0.wve56pf.mongodb.net/games | vercel env add MONGODBCON preview

echo.
echo Step 4: Redeploying to production...
vercel --prod

echo.
echo Done! Check https://game-backend-pi.vercel.app/games
pause
