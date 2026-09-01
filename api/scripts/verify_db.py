import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.models.coupon import Coupon

async def main():
    async with AsyncSessionLocal() as db:
        users = (await db.execute(select(User))).scalars().all()
        user_count = len(users)
        comp_count = (await db.execute(select(func.count(Company.id)))).scalar()
        prod_count = (await db.execute(select(func.count(Product.id)))).scalar()
        cat_count = (await db.execute(select(func.count(Category.id)))).scalar()
        order_count = (await db.execute(select(func.count(Order.id)))).scalar()
        coupon_count = (await db.execute(select(func.count(Coupon.id)))).scalar()

        print("--------------------------------------------------")
        print(f"Total Users:      {user_count}")
        for u in users:
            print(f"  - User: {u.email} | Role: {u.role.value}")
        print(f"Total Companies:  {comp_count}")
        print(f"Total Products:   {prod_count}")
        print(f"Total Categories: {cat_count}")
        print(f"Total Orders:     {order_count}")
        print(f"Total Coupons:    {coupon_count}")
        print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
