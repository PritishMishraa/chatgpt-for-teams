'use client'

import * as React from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { IconPlus, IconSpinner } from '@/components/ui/icons'
import { useAtom } from 'jotai'
import { SelectedTeamAtom } from '@/lib/atoms/teams'
import {
  TeamMembers,
  inviteTeamMember,
  getTeamMembers,
  getTeamOwnerEmail
} from '@/app/actions'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Input } from './ui/input'

interface InviteMemberProps {
  userEmail: string | undefined
  selectedTeamId: number | undefined
}

export function InviteMember({ userEmail, selectedTeamId }: InviteMemberProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [isInvitePending, startInviteTransition] = React.useTransition()
  const [teamMembers, setTeamMembers] = React.useState<TeamMembers>([])
  const [selectedTeamAtom, _] = useAtom(SelectedTeamAtom)
  const [newTeamMemberEmail, setNewTeamMemberEmail] = React.useState('')
  const [teamOwnerEmail, setTeamOwnerEmail] = React.useState('')
  const isOwner = teamOwnerEmail === userEmail

  React.useEffect(() => {
    const fetchTeamMembers = async () => {
      if (selectedTeamId) {
        try {
          const members = await getTeamMembers(selectedTeamId)
          const email = await getTeamOwnerEmail(selectedTeamId)
          setTeamOwnerEmail(email)
          setTeamMembers(members)
        } catch (error) {
          toast.error('Failed to fetch team members')
        }
      }
    }

    fetchTeamMembers()
  }, [selectedTeamId])

  const limitReached = teamMembers.length == 5

  if (selectedTeamId == undefined || selectedTeamAtom == undefined) {
    return null
  }

  return (
    <>
      <div className="mb-2 px-2">
        <Button
          variant="outline"
          className="h-10 w-full  justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10"
          disabled={isInvitePending}
          onClick={() => setInviteDialogOpen(true)}
        >
          <IconPlus className="-translate-x-2 stroke-2" />
          Invite Member
        </Button>
      </div>
      <AlertDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isOwner
                ? `Invite Members to Your Team - ${selectedTeamAtom.name}`
                : `Team Members - ${selectedTeamAtom.name}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isOwner &&
                'Send an email invitation to your team members to join your team.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Separator />
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm tracking-wider">{teamOwnerEmail}</span>
              <Badge variant="default">Owner</Badge>
            </div>
            {teamMembers &&
              teamMembers.map(({ user }) => {
                return (
                  <div
                    key={user.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm tracking-wider">{user.email}</span>
                    <Badge variant="outline">Member</Badge>
                  </div>
                )
              })}
          </div>
          {!limitReached && isOwner && (
            <>
              <Input
                id="email"
                placeholder="invite@email.com"
                type="email"
                value={newTeamMemberEmail}
                onChange={e => setNewTeamMemberEmail(e.target.value)}
                onKeyUp={e => {
                  if (e.key === 'Enter') {
                    startInviteTransition(async () => {
                      const res = await inviteTeamMember(
                        selectedTeamId,
                        newTeamMemberEmail
                      )

                      if (res && 'error' in res) {
                        toast.error(res.error)
                        return
                      }

                      setInviteDialogOpen(false)
                      toast.success('Email invitation sent successfully!')
                    })
                  }
                }}
              />

              <span className="text-xs text-muted-foreground text-right">
                {`${5 - teamMembers.length} invites left.`}
              </span>
            </>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isInvitePending}>
              {!limitReached && isOwner ? 'Cancel' : 'Close'}
            </AlertDialogCancel>
            {!limitReached && isOwner && (
              <AlertDialogAction
                disabled={isInvitePending}
                onClick={event => {
                  event.preventDefault()
                  startInviteTransition(async () => {
                    const res = await inviteTeamMember(
                      selectedTeamId,
                      newTeamMemberEmail
                    )

                    if (res && 'error' in res) {
                      toast.error(res.error)
                      return
                    }

                    setInviteDialogOpen(false)
                    setNewTeamMemberEmail('')
                    toast.success('Email invitation sent successfully!')
                  })
                }}
              >
                {isInvitePending && (
                  <IconSpinner className="mr-2 animate-spin" />
                )}
                Invite Member
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
