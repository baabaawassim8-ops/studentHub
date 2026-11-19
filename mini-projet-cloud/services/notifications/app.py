import os
import time

import psycopg
from flask import Flask, jsonify, request

app = Flask(__name__)
DATABASE_URL = os.environ["DATABASE_URL"]


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
    raise RuntimeError(f"Base notifications indisponible: {last_error}")


def init_db():
    wait_for_db()
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                recipient TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.commit()


def notification_json(row):
    return {
        "id": row[0],
        "recipient": row[1],
        "subject": row[2],
        "message": row[3],
        "status": row[4],
        "created_at": row[5].isoformat(),
    }


@app.get("/health")
def health():
    return jsonify({"service": "notifications", "status": "ok"})


@app.get("/notifications")
def list_notifications():
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, recipient, subject, message, status, created_at
            FROM notifications
            ORDER BY id DESC
            """
        ).fetchall()
    return jsonify([notification_json(row) for row in rows])


@app.post("/notify")
def notify():
    body = request.get_json(silent=True) or {}
    recipient = (body.get("recipient") or "").strip()
    subject = (body.get("subject") or "").strip()
    message = (body.get("message") or "").strip()

    if "@" not in recipient:
        return jsonify({"error": "recipient doit être une adresse e-mail"}), 400
    if not subject or not message:
        return jsonify({"error": "subject et message sont obligatoires"}), 400

    with connect() as conn:
        row = conn.execute(
            """
            INSERT INTO notifications (recipient, subject, message, status)
            VALUES (%s, %s, %s, 'sent')
            RETURNING id, recipient, subject, message, status, created_at
            """,
            (recipient, subject, message),
        ).fetchone()
        conn.commit()

    return jsonify(notification_json(row)), 201


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5003")))
