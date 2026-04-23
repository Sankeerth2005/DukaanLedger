import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const shopId = (session.user as any).shopId;
  if (!shopId) {
    return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
  }

  try {
    const staff = await prisma.user.findMany({
      where: { role: "STAFF", shopId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        staffProfile: {
          select: {
            id: true,
            phone: true,
            salary: true,
            performancePoints: true,
            joiningDate: true,
            notes: true,
            increments: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("Fetch staff error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const shopId = (session.user as any).shopId;
  if (!shopId) {
    return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, phone, salary, joiningDate, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    // Create user (no email/password for staff)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        role: "STAFF",
        shopId,
        staffProfile: {
          create: {
            phone: phone || "",
            salary: parseFloat(salary) || 0,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            notes: notes || "",
          },
        },
      },
      include: {
        staffProfile: true,
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ success: false, error: "Failed to create staff" }, { status: 500 });
  }
}
