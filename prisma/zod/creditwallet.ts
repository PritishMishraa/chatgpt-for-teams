import * as z from "zod"
import { CompleteTeam, relatedTeamSchema } from "./index"

export const creditWalletSchema = z.object({
  id: z.number().int(),
  teamId: z.number().int(),
  balance: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteCreditWallet extends z.infer<typeof creditWalletSchema> {
  team: CompleteTeam
}

/**
 * relatedCreditWalletSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const relatedCreditWalletSchema: z.ZodSchema<CompleteCreditWallet> = z.lazy(() => creditWalletSchema.extend({
  team: relatedTeamSchema,
}))
