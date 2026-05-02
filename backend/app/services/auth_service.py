from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import random
import string
from app.models.user import User
from app.models.organization import Organization
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token, create_refresh_token

from app.services.audit_service import audit_service
from app.services.notification_service import NotificationService

class AuthService:
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    def register_user(db: Session, user: UserCreate):
        # 1. Check existing email
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

        try:
            # 2. Check if org exists with this email, or create it
            org = db.query(Organization).filter(Organization.email == user.email).first()
            
            if not org:
                org = Organization(
                    name=user.organization_name,
                    email=user.email,
                    phone=user.phone
                )
                db.add(org)
                db.flush()

            # 3. Hash password (uses rounds=12 from security.py)
            hashed = hash_password(user.password)

            # 4. Create user (OTP Removed - Direct Activation)
            new_user = User(
                email=user.email,
                password_hash=hashed,
                full_name=user.full_name,
                phone=user.phone,
                license_number=user.license_number,
                organization_id=org.organization_id,
                role="admin",
                status="active",
                email_verified=True,
                phone_verified=True
            )
            
            db.add(new_user)
            db.commit()

            # 5. Log event
            audit_service.log_event(
                db, 
                action="user_registration", 
                user_id=new_user.user_id,
                organization_id=org.organization_id,
                details={"email": user.email}
            )
            
            return {
                "message": "Registration successful. You can now log in.",
                "user_id": new_user.user_id
            }

        except IntegrityError as e:
            db.rollback()
            err_str = str(e.orig).lower()
            if "license_number" in err_str:
                raise HTTPException(status_code=400, detail="License number already registered.")
            if "email" in err_str:
                raise HTTPException(status_code=400, detail="Email already in use.")
            raise HTTPException(status_code=400, detail="Registration failed.")
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def login_user(db: Session, user: UserLogin):
        try:
            db_user = db.query(User).filter(User.email == user.email).first()

            if not db_user:
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Check if locked
            if db_user.locked_until and db_user.locked_until > datetime.utcnow():
                raise HTTPException(status_code=403, detail="Account locked. Please try again later.")

            if not verify_password(user.password, db_user.password_hash):
                db_user.failed_login_attempts += 1
                if db_user.failed_login_attempts >= 5:
                    # Lock for 15 mins
                    from datetime import timedelta
                    db_user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                db.commit()
                
                # Log failed attempt
                audit_service.log_event(db, action="login_failed", details={"email": user.email}, status="failure")
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Update login info
            db_user.last_login = datetime.utcnow()
            db_user.failed_login_attempts = 0
            db_user.locked_until = None
            db.commit()

            # Create tokens
            access_token = create_access_token({
                "sub": db_user.email,
                "role": db_user.role,
                "org_id": str(db_user.organization_id)
            })

            refresh_token = create_refresh_token({
                "sub": db_user.email
            })

            # Log success
            audit_service.log_event(
                db, 
                action="login_success", 
                user_id=db_user.user_id, 
                organization_id=db_user.organization_id
            )

            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": db_user.user_id,
                    "email": db_user.email,
                    "full_name": db_user.full_name,
                    "role": db_user.role,
                    "organization_id": db_user.organization_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    @staticmethod
    def verify_otp(db: Session, user_id: str, otp: str):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Development Bypass: Allow 123456 for testing
        if otp == "123456":
            print(f"DEBUG: Using master OTP for user {user_id}")
        elif user.otp != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        if user.otp_expiry and user.otp_expiry < datetime.utcnow() and otp != "123456":
            raise HTTPException(status_code=400, detail="OTP expired")
        
        user.email_verified = True
        user.phone_verified = True
        user.status = "active"
        user.otp = None
        user.otp_expiry = None
        db.commit()
        
        return {"message": "Account verified successfully"}

    @staticmethod
    def update_profile(db: Session, user_id: str, data: dict):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        allowed_fields = ["full_name", "phone", "timezone", "language_preference"]
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_security(db: Session, user_id: str, data: dict):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if "current_password" in data and "new_password" in data:
            if not verify_password(data["current_password"], user.password_hash):
                raise HTTPException(status_code=400, detail="Incorrect current password")
            user.password_hash = hash_password(data["new_password"])
        
        if "twofa_enabled" in data:
            user.twofa_enabled = data["twofa_enabled"]
            
        db.commit()
        return {"message": "Security settings updated successfully"}

