import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Dynamic import to prevent build-time instantiation
    const { prisma } = await import("@/lib/prisma");
    
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction to create User, their Shop, and default Settings
    const user = await prisma.$transaction(async (tx: any) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: { name, email, password: hashedPassword, role: "OWNER" },
      });

      // 2. Create their dedicated Shop
      const shop = await tx.shop.create({
        data: { name: `${name}'s Shop`, ownerId: newUser.id },
      });

      // 3. Link User to Shop
      const updatedUser = await tx.user.update({
        where: { id: newUser.id },
        data: { shopId: shop.id },
      });

      // 4. Create default settings for this Shop
      await tx.shopSettings.create({
        data: { shopId: shop.id, shopName: `${name}'s Shop` },
      });

      return updatedUser;
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
