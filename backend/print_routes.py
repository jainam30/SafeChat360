from app.main import app
import json

with open("routes_out.txt", "w", encoding="utf-8") as f:
    f.write("Printing all routes:\n")
    for route in app.routes:
        if hasattr(route, "path"):
            f.write(f"Path: {route.path}, Name: {route.name}, Methods: {route.methods if hasattr(route, 'methods') else 'WS'}\n")
        else:
            f.write(f"Route: {route}\n")
