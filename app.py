from flask import Flask, render_template, request, redirect, url_for, send_from_directory, abort, jsonify
from werkzeug.utils import secure_filename
import os
import math

app = Flask(__name__, static_folder="static", template_folder="templates")

BASE_DIR = os.path.abspath("uploads")

def ensure_base():
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

def safe_path(path):
    # Normalize empty path
    if not path:
        path = ""
    full_path = os.path.abspath(os.path.join(BASE_DIR, path))
    if not full_path.startswith(BASE_DIR):
        abort(403)
    return full_path

def human_size(n):
    if n < 1024:
        return f"{n} B"
    exp = int(math.log(n, 1024))
    pre = "KMGTPE"[exp-1]
    return f"{n / (1024**exp):.1f} {pre}B"

@app.route("/")
def index():
    ensure_base()
    return render_template("index.html")

@app.route("/api/list", methods=["GET"])
def api_list():
    subpath = request.args.get("path", "")
    current_path = safe_path(subpath)
    if not os.path.exists(current_path):
        os.makedirs(current_path)
    items = []
    for name in sorted(os.listdir(current_path), key=lambda s: s.lower()):
        full = os.path.join(current_path, name)
        is_dir = os.path.isdir(full)
        size = 0
        if not is_dir:
            try:
                size = os.path.getsize(full)
            except OSError:
                size = 0
        items.append({
            "name": name,
            "is_dir": is_dir,
            "size": human_size(size),
            "path": os.path.join(subpath, name).replace("\\", "/")
        })
    parent = os.path.dirname(subpath).replace("\\", "/") if subpath else ""
    return jsonify({"items": items, "current": subpath, "parent": parent})

@app.route("/api/create-folder", methods=["POST"])
def api_create_folder():
    folder = request.form.get("folder", "").strip()
    path = request.form.get("path", "")
    if not folder:
        return jsonify({"ok": False, "error": "Folder name required"}), 400
    target = safe_path(os.path.join(path, folder))
    os.makedirs(target, exist_ok=True)
    return jsonify({"ok": True})

@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "No file part"}), 400
    file = request.files["file"]
    path = request.form.get("path", "")
    if file.filename == "":
        return jsonify({"ok": False, "error": "No selected file"}), 400
    filename = secure_filename(file.filename)
    dest_dir = safe_path(path)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, filename)
    file.save(dest)
    return jsonify({"ok": True})

@app.route("/api/delete", methods=["POST"])
def api_delete():
    path = request.form.get("path", "")
    target = safe_path(path)
    if not os.path.exists(target):
        return jsonify({"ok": False, "error": "Not found"}), 404
    try:
        if os.path.isdir(target):
            # only remove empty directories to be safe
            os.rmdir(target)
        else:
            os.remove(target)
    except OSError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    return jsonify({"ok": True})

@app.route("/open/<path:filepath>")
def open_file(filepath):
    directory = os.path.dirname(filepath)
    filename = os.path.basename(filepath)
    return send_from_directory(safe_path(directory), filename, as_attachment=False)

if __name__ == "__main__":
    ensure_base()
    app.run(debug=True)