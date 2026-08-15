
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, company, hard } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const resizedBuffer = await sharp(buffer)
      .resize(500, 500, { fit: "inside" })
      .toBuffer();

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `${hard}_${company}.jpg`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, resizedBuffer);

    return NextResponse.json({
      success: true,
      file: `/uploads/${fileName}`,
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}












/*import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64,company,hard } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Remove "data:image/jpeg;base64," prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Resize image with sharp
    const resizedBuffer = await sharp(buffer)
      .resize(500, 500, { fit: "inside" }) // adjust size as needed
      .toBuffer();

    // Save to public/uploads
    const uploadsDir = path.join(process.cwd(), "public/uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

   // const fileName = `img_${Date.now()}.jpg`;
   const fileName = `${hard}_${company}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, resizedBuffer);

    return NextResponse.json({
      success: true,
      file: `/uploads/${fileName}`, // public path
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
*/