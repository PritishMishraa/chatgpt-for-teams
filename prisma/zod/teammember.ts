import * as z from "zod"
import { Role } from "@prisma/client"
import { CompleteUser, relatedUserSchema, CompleteTeam, relatedTeamSchema } from "./index"

export const teamMemberSchema = z.object({
  userId: z.string(),
  teamId: z.number().int(),
  role: z.nativeEnum(Role),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteTeamMember extends z.infer<typeof teamMemberSchema> {
  user: CompleteUser
  team: CompleteTeam
}

/**
 * relatedTeamMemberSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const relatedTeamMemberSchema: z.ZodSchema<CompleteTeamMember> = z.lazy(() => teamMemberSchema.extend({
  user: relatedUserSchema,
  team: relatedTeamSchema,
}))
