import * as z from "zod"
import { CompleteTeam, relatedTeamSchema, CompleteUser, relatedUserSchema, CompleteMessage, relatedMessageSchema } from "./index"

export const conversationSchema = z.object({
  id: z.number().int(),
  teamId: z.number().int(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteConversation extends z.infer<typeof conversationSchema> {
  team: CompleteTeam
  createdBy: CompleteUser
  messages: CompleteMessage[]
}

/**
 * relatedConversationSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const relatedConversationSchema: z.ZodSchema<CompleteConversation> = z.lazy(() => conversationSchema.extend({
  team: relatedTeamSchema,
  createdBy: relatedUserSchema,
  messages: relatedMessageSchema.array(),
}))
