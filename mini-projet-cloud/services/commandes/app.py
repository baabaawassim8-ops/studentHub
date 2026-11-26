import os
import time

import psycopg
import requests
from flask import Flask, jsonify, request

app = Flask(__name__)
DATABASE_URL = os.environ["DATABASE_URL"]
CATALOGUE_URL = os.environ["CATALOGUE_URL"].rstrip("/")
NOTIFICATIONS_URL = os.environ["NOTIFICATIONS_URL"].rstrip("/")


def connect():
    return psycopg.connect(DATABASE_URL)


def wait_for_db():
    last_error = None
    for _ in range(30):
        try:
            with psycopg.connect(DATABASE_URL, connect_timeout=3) as conn:
                conn.execute("SELECT 1")
            return
        except Exception as exc:
            last_error = exc
            time.sleep(2)
    raise RuntimeError(f"Base commandes indisponible: {last_error}")


def init_db():
    wait_for_db()
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price_tnd NUMERIC(10, 2) NOT NULL,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                status TEXT NOT NULL,
                notification_id INTEGER,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.commit()


def order_json(row):
    return {
        "id": row[0],
        "product_id": row[1],
        "product_name": row[2],
        "quantity": row[3],
        "unit_price_tnd": float(row[4]),
        "total_tnd": float(row[4]) * row[3],
        "customer_name": row[5],
        "customer_email": row[6],
        "status": row[7],
        "notification_id": row[8],
        "created_at": row[9].isoformat(),
    }


@app.get("/health")
def health():
    return jsonify({"service": "commandes", "status": "ok"})


@app.get("/orders")
def list_orders():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, product_id, product_name, quantity, unit_price_tnd,
                   customer_name, customer_email, status, notification_id, created_at
            FROM orders
            ORDER BY id DESC
            """
        ).fetchall()
    return jsonify([order_json(row) for row in rows])


@app.post("/orders")
def create_order():
    body = request.get_json(silent=True) or {}
    product_id = body.get("product_id")
    quantity = body.get("quantity")
    customer_name = (body.get("customer_name") or "").strip()
    customer_email = (body.get("customer_email") or "").strip()

    if not isinstance(product_id, int) or product_id < 1:
        return jsonify({"error": "product_id doit être un entier positif"}), 400
    if not isinstance(quantity, int) or quantity < 1:
        return jsonify({"error": "quantity doit être un entier positif"}), 400
    if not customer_name:
        return jsonify({"error": "customer_name est obligatoire"}), 400
    if "@" not in customer_email or "." not in customer_email.split("@")[-1]:
        return jsonify({"error": "customer_email est invalide"}), 400

    try:
        reserved = requests.post(
            f"{CATALOGUE_URL}/products/{product_id}/reserve",
            json={"quantity": quantity},
            timeout=5,
        )
    except requests.RequestException:
        return jsonify({"error": "Le service catalogue est indisponible"}), 503

    if reserved.status_code == 409:
        return jsonify(reserved.json()), 409
    if reserved.status_code == 404:
        return jsonify({"error": "Produit introuvable"}), 404
    if reserved.status_code != 200:
        return jsonify({"error": "Échec de la réservation du stock"}), 502

    product = reserved.json()
    message = (
        f"Bonjour {customer_name}, votre commande de {quantity} × {product['name']} "
        f"est confirmée. Total : {product['price_tnd'] * quantity:.2f} TND."
    )

    notification_id = None
    status = "confirmed"
    try:
        notified = requests.post(
            f"{NOTIFICATIONS_URL}/notify",
            json={
                "recipient": customer_email,
                "subject": f"Commande confirmée — {product['name']}",
                "message": message,
            },
            timeout=5,
        )
        if notified.status_code == 201:
            notification_id = notified.json()["id"]
        else:
            status = "confirmed_notification_failed"
    except requests.RequestException:
        status = "confirmed_notification_failed"

    with connect() as conn:
        row = conn.execute(
            """
            INSERT INTO orders (
                product_id, product_name, quantity, unit_price_tnd,
                customer_name, customer_email, status, notification_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, product_id, product_name, quantity, unit_price_tnd,
                      customer_name, customer_email, status, notification_id, created_at
            """,
            (
                product["id"],
                product["name"],
                quantity,
                product["price_tnd"],
                customer_name,
                customer_email,
                status,
                notification_id,
            ),
        ).fetchone()
        conn.commit()

    return jsonify(order_json(row)), 201


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5002")))
