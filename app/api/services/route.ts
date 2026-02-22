import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ServiceWithCategory {
  id: number;
  name: string;
  duration_minutes: number;
  pl_price: number;
  usdt_price: number;
  ton_price: number;
  points: number;
  category_id: number;
  haircut_categories: {
    id: number;
    name: string;
  };
}

export async function GET(): Promise<Response> {
    

    try {
        const services = await prisma.services.findMany({
            include: {
                haircut_categories: true
            }
        });
        const serializedServices = services.map((service: ServiceWithCategory) => ({
            id: Number(service.id),
            name: service.name,
            duration_minutes: Number(service.duration_minutes),
            pl_price: Number(service.pl_price),
            category_id: Number(service.category_id),
            category_name: service.haircut_categories!.name
        }));
        
        return new Response(JSON.stringify(serializedServices), {status: 200});
    } catch(error){
        console.error('Database error:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Failed to fetch services' }),
            { status: 500 }
        );
    }
}