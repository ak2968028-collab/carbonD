"""Create a dashboard user, or reset the password of an existing one.

    docker compose exec backend python script/create_user.py <username> <password> ["Full name"]
"""
import sys

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.conf.settings import settings
from app.database.models import User
from app.services.auth_service import hash_password


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    username, password = sys.argv[1], sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else None
    if len(password) < 8:
        sys.exit("Password must be at least 8 characters.")

    engine = create_engine(settings.database_url.replace("+asyncpg", "+psycopg2"))
    with Session(engine) as db, db.begin():
        user = db.scalar(select(User).where(User.username == username))
        if user:
            user.hashed_password = hash_password(password)
            user.full_name = full_name or user.full_name
            print(f"[✓] Password updated for '{username}'.")
        else:
            db.add(User(username=username, full_name=full_name, hashed_password=hash_password(password)))
            print(f"[✓] User '{username}' created.")


if __name__ == "__main__":
    main()
