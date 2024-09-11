import type { schemes } from "@prisma/client";

export type SchemesType = schemes & {
  sub_schemes?: schemes[]
}
