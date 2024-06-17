'use client'

import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createTeam, setCurrTeamId } from '@/app/actions'
import { useLocalStorage } from 'usehooks-ts'

export default function TeamSwitcherFirst() {
  const router = useRouter()

  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const [newTeamName, setNewTeamName] = React.useState('')
  const [_, setSelectedTeam] = useLocalStorage('selectedTeam', null)
  
  async function onSubmit() {
    console.log('Creating team', newTeamName)
    const res = await createTeam(newTeamName)
    if (res && 'error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Team created successfully')
      console.log('Team created successfully')
      //@ts-ignore
      setSelectedTeam(res)
      await setCurrTeamId(res.id)
      router.refresh()
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Add a new team to manage different chats.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Input
                id="name"
                placeholder="Acme Inc."
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onKeyUp={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onSubmit()
                    setShowNewTeamDialog(false)
                  }
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={e => {
              e.preventDefault()
              onSubmit()
              setShowNewTeamDialog(false)
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
