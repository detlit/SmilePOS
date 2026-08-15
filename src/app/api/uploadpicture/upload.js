import { getImage } from "../../utils/formidable";
import { uploadImage } from "../../utils/cloudinary";
import { NextRequest } from 'next/server'

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  if (!prisma) throw new Error("Prisma is not available during build.");
  return prisma;
}





export default async function handle(req, res) {
  const imageUploaded = await getImage(req);
const prisma = await getPrisma();
  const imageData = await uploadImage(imageUploaded.path);

  const result = await prisma.settingStore.create({
    data: {
      publiclogoId: String(imageData.public_id),
      formatlogo:  String(imageData.format),
      versionlogo:  String(imageData.version.toString()),
    },
  });

  res.json(result);
}


