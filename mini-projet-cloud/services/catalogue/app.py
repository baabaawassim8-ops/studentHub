import os
import time

import psycopg
from flask import Flask, jsonify, request

app = Flask(__name__)
DATABASE_URL = os.environ["DATABASE_URL"]

PRODUCTS = [
    ("Savon à l'huile d'olive", "Savon", "Savon à froid, huile d'olive de Tunisie.", 12.50, 40),
    ("Huile d'argan bio", "Huile", "Huile d'argan pressée à froid, flacon 50 ml.", 45.00, 25),
    ("Fleur d'oranger", "Huile essentielle", "Huile essentielle de fleur d'oranger, 10 ml.", 28.00, 30),
    ("Savon miel et lavande", "Savon", "Savon surgras au miel et à la lavande.", 15.00, 35),
    ("Crème au figuier de Barbarie", "Cosmétique", "Crème visage aux pépins de figue de Barbarie.", 62.00, 18),
    ("Huile de figue de Barbarie", "Huile", "Huile rare de pépins de figue de Barbarie, 30 ml.", 89.00, 10),
]


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
    raise RuntimeError(f"Base catalogue indisponible: {last_error}")


def init_db():
    wait_for_db()
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                price_tnd NUMERIC(10, 2) NOT NULL,
                stock INTEGER NOT NULL CHECK (stock >= 0)
            )
            """
        )
        count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count == 0:
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO products (name, category, description, price_tnd, stock)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    PRODUCTS,
                )
        conn.commit()


def product_json(row):
    return {
        "id": row[0],
        "name": row[1],
        "category": row[2],
        "description": row[3],
        "price_tnd": float(row[4]),
        "stock": row[5],
    }


@app.get("/health")
def health():
    return jsonify({"service": "catalogue", "status": "ok"})


@app.get("/products")
def list_products():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, name, category, description, price_tnd, stock
            FROM products
            ORDER BY id
            """
        ).fetchall()
    return jsonify([product_json(row) for row in rows])


@app.get("/products/<int:product_id>")
def get_product(product_id):
    with connect() as conn:
        row = conn.execute(
            """
            SELECT id, name, category, description, price_tnd, stock
            FROM products
            WHERE id = %s
            """,
            (product_id,),
        ).fetchone()
    if row is None:
        return jsonify({"error": "Produit introuvable"}), 404
    return jsonify(product_json(row))


@app.post("/products/<int:product_id>/reserve")
def reserve_product(product_id):
    body = request.get_json(silent=True) or {}
    quantity = body.get("quantity")
    if not isinstance(quantity, int) or quantity < 1:
        return jsonify({"error": "La quantité doit être un entier positif"}), 400

    with connect() as conn:
        row = conn.execute(
            """
            UPDATE products
            SET stock = stock - %s
            WHERE id = %s AND stock >= %s
            RETURNING id, name, category, description, price_tnd, stock
            """,
            (quantity, product_id, quantity),
        ).fetchone()
        conn.commit()

    if row is None:
        return jsonify({"error": "Stock insuffisant ou produit introuvable"}), 409
    return jsonify(product_json(row))


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5001")))
