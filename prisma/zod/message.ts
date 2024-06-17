import * as z from "zod"
import { CompleteConversation, relatedConversationSchema, CompleteUser, relatedUserSchema } from "./index"

export const messageSchema = z.object({
  id: z.number().int(),
  conversationId: z.number().int(),
  senderId: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteMessage extends z.infer<typeof messageSchema> {
  conversation: CompleteConversation
  sender: CompleteUser
}

/**
 * relatedMessageSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const relatedMessageSchema: z.ZodSchema<CompleteMessage> = z.lazy(() => messageSchema.extend({
  conversation: relatedConversationSchema,
  sender: relatedUserSchema,
}))
