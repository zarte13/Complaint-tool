from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.models.models import Base, Company, Part
import os

def init_database():
    """Initialize database with sample data"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if we already have data
        if db.query(Company).count() > 0:
            print("Database already initialized")
            return
        
        # Sample companies
        companies = [
            "Acme Manufacturing Corp",
            "TechParts Solutions LLC",
            "Global Supply Chain Inc",
            "Precision Components Ltd",
            "Industrial Parts Co",
            "Advanced Materials Group",
            "Quality Parts Distributors",
            "Reliable Components Inc",
            "Superior Manufacturing",
            "Elite Parts Network"
        ]
        
        # Sample parts
        parts_data = [
            ("PCB-001", "Printed Circuit Board - Standard"),
            ("PCB-002", "Printed Circuit Board - High Frequency"),
            ("MOTOR-001", "Electric Motor - 12V DC"),
            ("MOTOR-002", "Electric Motor - 24V DC"),
            ("SENSOR-001", "Temperature Sensor - Digital"),
            ("SENSOR-002", "Pressure Sensor - Analog"),
            ("BATTERY-001", "Lithium Battery - 18650"),
            ("BATTERY-002", "Lithium Battery - 21700"),
            ("CONNECTOR-001", "USB-C Connector - Female"),
            ("CONNECTOR-002", "HDMI Connector - Male"),
            ("SWITCH-001", "Push Button Switch - Momentary"),
            ("SWITCH-002", "Toggle Switch - SPDT"),
            ("LED-001", "LED - Red 5mm"),
            ("LED-002", "LED - Blue 3mm"),
            ("RESISTOR-001", "Resistor - 1kΩ 1/4W"),
            ("RESISTOR-002", "Resistor - 10kΩ 1/4W"),
            ("CAPACITOR-001", "Capacitor - 100uF 25V"),
            ("CAPACITOR-002", "Capacitor - 1000uF 16V"),
            ("TRANSISTOR-001", "NPN Transistor - 2N2222"),
            ("TRANSISTOR-002", "PNP Transistor - 2N2907")
        ]
        
        # Add companies
        company_objects = []
        for company_name in companies:
            company = Company(name=company_name)
            db.add(company)
            company_objects.append(company)
        
        # Add parts
        part_objects = []
        for part_number, description in parts_data:
            part = Part(part_number=part_number, description=description)
            db.add(part)
            part_objects.append(part)
        
        db.commit()
        print(f"Initialized database with {len(companies)} companies and {len(parts_data)} parts")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure database directory exists
    os.makedirs("database", exist_ok=True)
    init_database()