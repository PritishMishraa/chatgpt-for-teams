import { TargetIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

interface ICredits {
  credits: number;
}

export function Credits({ credits }: ICredits) {
  return (
    <div className="mb-2 px-2">
      <Button
        variant="outline"
        className="h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors dark:bg-zinc-900 pointer-events-none"
      >
        <TargetIcon className="-translate-x-2 stroke-2" />
        Credits Left : {credits}
      </Button>
    </div>
  )
}