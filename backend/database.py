from sqlmodel import create_engine, SQLModel, Session

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/arcve"

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
