"""
Simple HTTP server for UPI Fraud Detection Frontend
Om Anand | AKTU B.Tech CSE | ML Project

Usage:
    python server.py           → runs on http://localhost:5500
    python server.py 8080      → runs on http://localhost:8080
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5500

# Serve from the directory where this script lives
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(FRONTEND_DIR)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Clean log output
        print(f"  [{self.log_date_time_string()}] {format % args}")

    def end_headers(self):
        # Allow requests from any origin (needed when backend runs separately)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

def open_browser():
    import time
    time.sleep(0.8)
    webbrowser.open(f"http://localhost:{PORT}")

print("=" * 55)
print("  UPI Fraud Detection — Om Anand | AKTU CSE")
print("=" * 55)
print(f"  Serving : {FRONTEND_DIR}")
print(f"  URL     : http://localhost:{PORT}")
print(f"  Press Ctrl+C to stop")
print("=" * 55)

# Auto-open browser in background
threading.Thread(target=open_browser, daemon=True).start()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
