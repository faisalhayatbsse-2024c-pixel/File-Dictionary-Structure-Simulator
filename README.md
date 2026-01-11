# My Flask File Manager

Simple Flask app that lets users add/open/delete files (upload folder, templates, static).

Run locally:
1. Create a virtual environment:
   - macOS/Linux:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   - Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run locally:
   ```bash
   python app.py
   ```
   Open http://127.0.0.1:5000

OR

4. Run 
 ``` Enter in Terminal one by one

    $env:FLASK_APP = "app.py"
    $env:FLASK_ENV = "development"
    python -m flask run
    
```
Notes:
- Do NOT commit the `venv/` directory or real uploaded user files. The `.gitignore` contains rules to avoid that.
- Use environment variables (e.g., `SECRET_KEY`) instead of hard-coding secrets.
- For production, use `gunicorn` (Procfile included).
