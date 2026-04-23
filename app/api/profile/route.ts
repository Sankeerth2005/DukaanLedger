import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendAccountDeletedEmail } from "@/lib/services/emailService";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Invalid email").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        shopId: true,
        createdAt: true,
        // Omit password always
      },
    });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { name, email, currentPassword, newPassword } = result.data;

    // Fetch current user
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // If changing password, verify current password
    if (newPassword) {
      if (!user.password) {
        return NextResponse.json(
          { success: false, error: "Cannot set password for OAuth accounts via this form. Use your provider." },
          { status: 400 }
        );
      }
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: "Current password is required" }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
      }
    }

    // Check if new email is already in use by another account
    if (email && email !== user.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 12);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, shopId: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true },
    });

    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Step 1: Break the circular FK — set user's shopId to null so we can delete shop safely
      if (user.shopId) {
        await tx.user.update({
          where: { id: user.id },
          data: { shopId: null },
        });

        // Step 2: Delete the shop (cascades products, sales, settings, staff, etc.)
        await tx.shop.delete({ where: { id: user.shopId } });
      }

      // Step 3: Delete the user account itself
      await tx.user.delete({ where: { id: user.id } });
    });

    // Send farewell email after successful deletion (fire-and-forget)
    if (user.email) {
      sendAccountDeletedEmail(user.email, user.name || "there").catch(() => {});
    }

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete account" }, { status: 500 });
  }
}
