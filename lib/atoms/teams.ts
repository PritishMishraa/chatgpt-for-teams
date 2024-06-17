import { atom } from 'jotai';

interface SelectedTeamAtom {
  id: number;
  name: string;
} 

export const SelectedTeamAtom = atom<SelectedTeamAtom | null>(null);