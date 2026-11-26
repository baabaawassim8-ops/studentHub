import os

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
CATALOGUE_URL = os.environ["CATALOGUE_URL"].rstrip("/")
COMMANDES_URL = os.environ["COMMANDES_URL"].rstrip("/")
NOTIFICATIONS_URL = os.environ["NOTIFICATIONS_URL"].rstrip("/")


def proxy(method, url, payload=None):
    try:
        response = requests.request(method, url, json=payload, timeout=8)
    except requests.RequestException:
        return jsonify({"error": "Service indisponible"}), 503
    try:
        body = response.json()
    except ValueError:
        body = {"error": "Réponse invalide du service"}
    return jsonify(body), response.status_code


@app.get("/health")
def health():
    return jsonify({"service": "web", "status": "ok"})


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/products")
def products():
    return proxy("GET", f"{CATALOGUE_URL}/products")


@app.get("/api/orders")
def orders():
    return proxy("GET", f"{COMMANDES_URL}/orders")


@app.post("/api/orders")
def create_order():
    return proxy("POST", f"{COMMANDES_URL}/orders", request.get_json(silent=True) or {})


@app.get("/api/notifications")
def notifications():
    return proxy("GET", f"{NOTIFICATIONS_URL}/notifications")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
