// prisma.config.ts - Prisma v6 configuration
import path from "path";

export default {
  schema: path.join(process.cwd(), "prisma", "schema.prisma"),
  envPaths: [path.join(process.cwd(), ".env")],
};
