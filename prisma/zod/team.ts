import * as z from "zod"
import { CompleteTeamMember, relatedTeamMemberSchema, CompleteUser, relatedUserSchema, CompleteConversation, relatedConversationSchema, CompleteCreditWallet, relatedCreditWalletSchema } from "./index"

export const teamSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  ownerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteTeam extends z.infer<typeof teamSchema> {
  members: CompleteTeamMember[]
  owner: CompleteUser
  conversations: CompleteConversation[]
  creditWallet?: CompleteCreditWallet | null
}

/**
 * relatedTeamSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const relatedTeamSchema: z.ZodSchema<CompleteTeam> = z.lazy(() => teamSchema.extend({
  members: relatedTeamMemberSchema.array(),
  owner: relatedUserSchema,
  conversations: relatedConversationSchema.array(),
  creditWallet: relatedCreditWalletSchema.nullish(),
}))
