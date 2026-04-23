import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getShopSettings, updateShopSettings } from "@/lib/services/settingsService";
import { shopSettingsSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const shopId = (session.user as any).shopId;
  if (!shopId) {
    return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
  }

  try {
    const settings = await getShopSettings(shopId);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Only owners can update shop settings" }, { status: 403 });
  }

  const shopId = (session.user as any).shopId;
  if (!shopId) {
    return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = shopSettingsSchema.safeParse(body);
    
    if (!result.success) {
      const errorMsg = result.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const settings = await updateShopSettings(shopId, result.data);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
