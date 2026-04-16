import fs from "fs";
import path from "path";

const getValidImage = (fileName?: string | null, folderPath?: string) => {
  if (!fileName || fileName.trim() === "") return null;

  const fullPath = path.join(
    process.cwd(),
    "storage",
    "uploads",
    folderPath || "",
    fileName
  );

  return fs.existsSync(fullPath) ? fileName : null;
};

export default getValidImage;
