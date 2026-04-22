import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getShopSettings, updateShopSettings } from "@/lib/services/settingsService";
import { shopSettingsSchema } from "@/lib/validations";

// GET /api/settings - Get shop settings
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getShopSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings - Update shop settings (OWNER only)
export async function PUT(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can update shop settings" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = shopSettingsSchema.safeParse(body);
    
    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const message = Object.values(firstError).flat()[0] || "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const settings = await updateShopSettings(parsed.data);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
