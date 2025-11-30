"use client";

import { GridContainer } from "@/components/layout/grid-container";
import { OrderCard } from "@/components/orders/order-card";
import { Order } from "@/lib/types";

// Mock Orders
const MOCK_ORDERS: Order[] = [
  {
    id: "ord_1",
    listingId: "lst_1",
    buyer: "0xAb5...9012",
    amount: "50.00",
    status: "PENDING",
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    id: "ord_2",
    listingId: "lst_3",
    buyer: "0xCd6...3456",
    amount: "10.00",
    status: "APPROVED",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
  {
    id: "ord_3",
    listingId: "lst_4",
    buyer: "0xEf7...7890",
    amount: "15.00",
    status: "REJECTED",
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
  },
];

export default function OrdersPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="p-8 border-b border-neutral-800 bg-neutral-950">
        <h1 className="text-4xl font-bold uppercase tracking-tight font-display">Pending Orders</h1>
        <p className="text-muted-foreground mt-2">Approve purchase requests to release files and receive funds.</p>
      </div>
      
      <GridContainer className="flex-grow border-r border-neutral-800 border-b">
        {MOCK_ORDERS.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </GridContainer>
    </div>
  );
}

