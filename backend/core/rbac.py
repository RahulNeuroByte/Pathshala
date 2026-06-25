from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.models.models import User, Role, Permission, RolePermission
from backend.api.v1.endpoints.login import get_current_user

def has_permission(required_permission: str):
    def permission_checker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        # Check if user's role has the required permission
        permission = db.query(Permission).filter(Permission.name == required_permission).first()
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Permission '{required_permission}' not found in database"
            )
        
        role_permission = db.query(RolePermission).filter(
            RolePermission.role_id == current_user.role_id,
            RolePermission.permission_id == permission.id
        ).first()
        
        if not role_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return True
    return permission_checker
