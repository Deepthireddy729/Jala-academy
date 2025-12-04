@echo off
echo Starting Heroku deployment process...

echo Step 1: Login to Heroku
heroku login
if %errorlevel% neq 0 (
    echo Failed to login. Please try again.
    pause
    exit /b 1
)

echo Step 2: Create Heroku app
heroku create
if %errorlevel% neq 0 (
    echo Failed to create app. Please check Heroku CLI installation.
    pause
    exit /b 1
)

echo Step 3: Deploy to Heroku (this will start the build process)
git push heroku main
if %errorlevel% neq 0 (
    echo Deployment failed. Please check the logs above.
    pause
    exit /b 1
)

echo Deployment completed successfully!
echo Your app should now be running on Heroku.
pause
