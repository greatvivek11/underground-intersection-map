#!/usr/bin/env python3
import sys
import os
from http.server import HTTPServer

# Add the root directory to the python path to resolve local imports cleanly
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(ROOT_DIR)

# Import the existing Vercel HTTP Handler from api/generate.py
from api.generate import handler

def run(port=8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, handler)
    print(f"Starting underground-intersection local backend on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down local backend server.")
        httpd.server_close()

if __name__ == "__main__":
    # Allow port overrides via command line arguments
    port_arg = 8000
    if len(sys.argv) > 1:
        try:
            port_arg = int(sys.argv[1])
        except ValueError:
            pass
    run(port=port_arg)
