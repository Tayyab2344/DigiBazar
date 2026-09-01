from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.user import User
from typing import List
from app.schemas.order_schemas import CheckoutRequest, CheckoutResponse, CustomerOrderRead
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/v1/orders", tags=["Orders & Checkout"])


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
async def checkout_orders(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Process multi-vendor cart checkout, create Order records per vendor company,
    deduct product stock inventory, and return created order IDs.
    """
    return await OrderService.create_checkout_orders(db, current_user, payload)


@router.get("/my-orders", response_model=List[CustomerOrderRead])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve list of orders placed by the authenticated customer.
    """
    return await OrderService.get_customer_orders(db, current_user)
