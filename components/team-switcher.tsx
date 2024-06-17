'use client'

import * as React from 'react'
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon
} from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Teams, createTeam, setCurrTeamId } from '@/app/actions'
import { SelectedTeamAtom } from '@/lib/atoms/teams'
import { useAtom } from 'jotai'
import { useLocalStorage } from 'usehooks-ts'

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface TeamSwitcherProps extends PopoverTriggerProps {
  className?: string
  teams: Teams
}

export default function TeamSwitcher({ className, teams }: TeamSwitcherProps) {
  const router = useRouter()
  type Team = (typeof teams)[number]

  const [open, setOpen] = React.useState(false)
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const [selectedTeam, setSelectedTeam] = useLocalStorage<Team>(
    'selectedTeam',
    teams[0]
  )
  const [newTeamName, setNewTeamName] = React.useState('')

  const [_, setSelectedTeamAtom] = useAtom(SelectedTeamAtom)

  React.useEffect(() => {
      setSelectedTeamAtom(selectedTeam)
      setCurrTeamId(selectedTeam.id)
      router.refresh()
  }, [selectedTeam, setSelectedTeamAtom, router])

  async function onSubmit() {
    const res = await createTeam(newTeamName)
    if (res && 'error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Team created successfully')
      console.log('Team created successfully')
      setNewTeamName('')
      router.refresh()
    }
  }

  if (teams.length === 0) {
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
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewTeamDialog(false)}
            >
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

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={cn('md:w-[200px] w-min justify-between', className)}
          >
            {selectedTeam.name}
            <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search team..." />
              <CommandEmpty>No team found.</CommandEmpty>
              <CommandGroup key="Owner" heading="Owner">
                {teams
                  .filter(t => t.isOwner == true)
                  .map(team => (
                    <CommandItem
                      key={team.name}
                      onSelect={() => {
                        setSelectedTeam(team)
                        setOpen(false)
                      }}
                      className="text-sm"
                    >
                      {team.name}
                      <CheckIcon
                        className={cn(
                          'ml-auto size-4',
                          selectedTeam.name === team.name
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup key="Member" heading="Member">
                {teams
                  .filter(t => t.isOwner == false)
                  .map(team => (
                    <CommandItem
                      key={team.name}
                      onSelect={() => {
                        setSelectedTeam(team)
                        setOpen(false)
                      }}
                      className="text-sm"
                    >
                      {team.name}
                      <CheckIcon
                        className={cn(
                          'ml-auto size-4',
                          selectedTeam.name === team.name
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewTeamDialog(true)
                    }}
                  >
                    <PlusCircledIcon className="mr-2 size-5" />
                    Create Team
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
