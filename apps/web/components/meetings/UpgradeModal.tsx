'use client';

import { useCheckout } from '@/queries/billing';
import LoadingButton from '@/components/general/LoadingButton';
import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import Link from 'next/link';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const { mutate: checkout, isPending } = useCheckout();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            You do not have enough minutes to schedule this meeting. Upgrade to Pro for 300 minutes per month.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-col gap-2 sm:flex-row'>
          <LoadingButton
            isLoading={isPending}
            onClick={() => checkout()}
            className='bg-accent text-accent-foreground hover:bg-accent/90'
          >
            Upgrade now
          </LoadingButton>
          <Button variant='outline' asChild>
            <Link href='/settings/billing' onClick={() => onOpenChange(false)}>
              View billing
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
