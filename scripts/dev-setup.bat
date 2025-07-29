@echo off
echo Setting up development environment...

REM Backend setup
cd backend
call conda activate dwell-insight-backend
pip install -r requirements.txt

REM Frontend setup
cd ../frontend
npm install

echo Development environment setup complete!