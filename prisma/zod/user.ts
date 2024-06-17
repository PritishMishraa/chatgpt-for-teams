import * as z from "zod"
import { CompleteTeamMember, relatedTeamMemberSchema, CompleteTeam, relatedTeamSchema, CompleteConversation, relatedConversationSchema, CompleteMessage, relatedMessageSchema, CompleteSession, relatedSessionSchema } from "./index"

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  email: z.string(),
  hashedPassword: z.string(),
  isEmailVerified: z.boolean(),
  verificationToken: z.string().nullish(),
  currentTeamId: z.number().int().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteUser extends z.infer<typeof userSchema> {
  teams: CompleteTeamMember[]
  Team: CompleteTeam[]
  Conversation: CompleteConversation[]
  Message: CompleteMessage[]
  sessions: CompleteSession[]
}

/**
 * relatedUserSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const relatedUserSchema: z.ZodSchema<CompleteUser> = z.lazy(() => userSchema.extend({
  teams: relatedTeamMemberSchema.array(),
  Team: relatedTeamSchema.array(),
  Conversation: relatedConversationSchema.array(),
  Message: relatedMessageSchema.array(),
  sessions: relatedSessionSchema.array(),
}))
