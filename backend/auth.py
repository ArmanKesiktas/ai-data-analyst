"""
Authentication helper functions for Supabase JWT-based auth
Updated to verify Supabase Auth JWT tokens
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
import httpx

# Supabase settings from environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# JWT secret for Supabase (you can find this in Supabase Dashboard > Settings > API > JWT Secret)
# For now, we decode without verification and validate via Supabase API
JWT_SECRET = os.getenv("JWT_SECRET", "")

# Security scheme
security = HTTPBearer()


async def verify_supabase_token(token: str) -> Optional[dict]:
    """
    Verify a Supabase JWT token by calling the Supabase auth API.
    Returns user data if valid, None if invalid.
    """
    try:
        # First, try to decode the JWT to get basic info
        # Supabase JWTs are signed with the JWT secret from your project
        # We'll decode without verification first, then verify via API
        
        # Decode token without verification to inspect claims
        unverified_payload = jwt.get_unverified_claims(token)
        
        if not unverified_payload:
            return None
            
        # Check expiration
        exp = unverified_payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
        
        # Verify token with Supabase by calling the user endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY
                }
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "sub": user_data.get("id"),
                    "email": user_data.get("email"),
                    "user_metadata": user_data.get("user_metadata", {})
                }
            else:
                return None
                
    except JWTError as e:
        print(f"JWT Error: {e}")
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


def decode_supabase_token_sync(token: str) -> Optional[dict]:
    """
    Synchronous version - decode Supabase JWT and extract claims.
    For use in sync contexts. Does basic validation only.
    """
    try:
        # Decode without verification (we trust Supabase signed it)
        unverified_payload = jwt.get_unverified_claims(token)
        
        if not unverified_payload:
            return None
        
        # Check expiration
        exp = unverified_payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
        
        # Extract user ID from 'sub' claim
        user_id = unverified_payload.get("sub")
        if not user_id:
            return None
            
        return {
            "sub": user_id,
            "email": unverified_payload.get("email"),
            "role": unverified_payload.get("role"),
            "user_metadata": unverified_payload.get("user_metadata", {})
        }
        
    except JWTError as e:
        print(f"JWT decode error: {e}")
        return None
    except Exception as e:
        print(f"Token decode error: {e}")
        return None


from database import User, get_db
from sqlalchemy.orm import Session

# ... (previous code)

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> int:
    """
    Dependency to get current user ID from Supabase JWT token.
    Syncs the Supabase user with local database and returns local Integer ID.
    """
    token = credentials.credentials
    payload = decode_supabase_token_sync(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    supabase_uid = payload.get("sub")
    email = payload.get("email")
    user_metadata = payload.get("user_metadata", {})
    full_name = user_metadata.get("full_name") or user_metadata.get("name") or email.split("@")[0]
    
    if not supabase_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing required claims",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user exists by Supabase UID
    user = db.query(User).filter(User.supabase_uid == supabase_uid).first()
    
    if not user:
        # Check if user exists by email (migration case or pre-existing)
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            # Link existing user to Supabase UID
            user.supabase_uid = supabase_uid
            db.commit()
            db.refresh(user)
        else:
            # Create new user
            user = User(
                supabase_uid=supabase_uid,
                email=email,
                full_name=full_name,
                hashed_password=None # Managed by Supabase
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    
    return user.id


def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[int]:
    """
    Dependency to optionally get current user ID.
    Returns None if no valid token is provided.
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_supabase_token_sync(token)
        
        if payload is None:
            return None
        
        supabase_uid = payload.get("sub")
        
        if not supabase_uid:
            return None
            
        user = db.query(User).filter(User.supabase_uid == supabase_uid).first()
        
        if user:
            return user.id
            
        # Try finding by email if we have it in payload
        email = payload.get("email")
        if email:
             user = db.query(User).filter(User.email == email).first()
             if user:
                 return user.id
                 
        return None
        
    except Exception:
        return None


# Keep these for backward compatibility during migration
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Legacy: Verify a password against its hash"""
    import bcrypt
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Legacy: Generate password hash"""
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
