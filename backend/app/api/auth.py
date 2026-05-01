from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.db.deps import get_db
from datetime import datetime
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.user import UserLogin
from app.core.security import hash_password, verify_password
from app.models.organization import Organization
from app.core.deps import get_current_user
from app.core.jwt import create_access_token, create_refresh_token, verify_token
router = APIRouter()

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check existing email
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    try:
        # Check if org exists with this email, or create it
        new_org = db.query(Organization).filter(Organization.email == user.email).first()
        if not new_org:
            new_org = Organization(
                name=user.organization_name,
                email=user.email,
                phone=user.phone
            )
            db.add(new_org)
            db.commit()
            db.refresh(new_org)

        # Hash password
        hashed = hash_password(user.password)

        # Create admin user
        new_user = User(
            email=user.email,
            password_hash=hashed,
            full_name=user.full_name,
            phone=user.phone,
            license_number=user.license_number,
            organization_id=new_org.organization_id,
            role="admin",
            status="active"
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()

        
        if isinstance(e, IntegrityError):
            err_str = str(e.orig)
            if "users_license_number_key" in err_str:
                raise HTTPException(status_code=400, detail="This License No. is already registered to another account.")
            elif "organizations_email_key" in err_str:
                raise HTTPException(status_code=400, detail="This organization email is already registered.")
            
        raise HTTPException(status_code=400, detail="An error occurred while creating your account. Please try again.")

    return {
        "message": "Organization and admin created successfully",
        "organization_id": new_org.organization_id,
        "user_id": new_user.user_id
    }

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="User not found")

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(status_code=401, detail="Invalid password")

    # Track login event
    db_user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token({
        "sub": db_user.email,
        "role": db_user.role
    })

    refresh_token = create_refresh_token({
        "sub": db_user.email
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

from pydantic import BaseModel

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_token(req: RefreshRequest):
    
    payload = verify_token(req.refresh_token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access_token = create_access_token({
        "sub": payload["sub"]
    })

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout():
    return {
        "message": "Logged out successfully"
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user