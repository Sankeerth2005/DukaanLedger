import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET a specific staff member's full details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const staff = await prisma.user.findFirst({
    where: { id, role: "STAFF", shopId: (session.user as any).shopId },
    include: { staffProfile: { include: { increments: { orderBy: { createdAt: "desc" } } } } },
  });
  if (!staff) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: staff });
}

// UPDATE staff details + profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, salary, notes, addPoints, setSalary, addIncrement } = body;

    // Verify ownership
    const staffUser = await prisma.user.findFirst({
      where: { id, role: "STAFF", shopId: (session.user as any).shopId },
      include: { staffProfile: true },
    });
    if (!staffUser) return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });

    // Update base user name if provided
    if (name) {
      await prisma.user.update({ where: { id }, data: { name } });
    }

    const profileId = staffUser.staffProfile?.id;
    if (!profileId) return NextResponse.json({ success: false, error: "Staff profile missing" }, { status: 404 });

    const profileUpdates: any = {};
    if (phone !== undefined) profileUpdates.phone = phone;
    if (notes !== undefined) profileUpdates.notes = notes;
    if (setSalary !== undefined) profileUpdates.salary = parseFloat(setSalary);

    // Add performance points
    if (addPoints !== undefined) {
      const current = staffUser.staffProfile?.performancePoints || 0;
      profileUpdates.performancePoints = current + parseInt(addPoints);
    }

    // Handle salary increment
    if (addIncrement) {
      const { amount, reason } = addIncrement;
      if (amount > 0) {
        await prisma.salaryIncrement.create({
          data: { staffProfileId: profileId, amount: parseFloat(amount), reason: reason || "" },
        });
        profileUpdates.salary = (staffUser.staffProfile?.salary || 0) + parseFloat(amount);
      }
    }

    const updated = await prisma.staffProfile.update({
      where: { id: profileId },
      data: profileUpdates,
      include: { increments: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ success: false, error: "Failed to update staff" }, { status: 500 });
  }
}

// DELETE a staff member
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const staffUser = await prisma.user.findFirst({
      where: { id, role: "STAFF", shopId: (session.user as any).shopId },
    });
    if (!staffUser) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Staff removed" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}
