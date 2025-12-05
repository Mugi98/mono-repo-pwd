'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
};

type EditForm = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
};

// -------- Delete Dialog --------
type DeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteUser: UserRow | null;
  onDelete: (user: UserRow) => void;
};

export function DeleteDialog({
  open,
  onOpenChange,
  deleteUser,
  onDelete,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteUser && onDelete(deleteUser)}
            className="bg-sky-600 hover:bg-sky-500"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------- View Dialog --------
type ViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserRow | null;
};

export function ViewDialog({
  open,
  onOpenChange,
  selectedUser,
}: ViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>
            Basic information about this user.
          </DialogDescription>
        </DialogHeader>
        {selectedUser && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400">Name</p>
              <p className="font-medium">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Email</p>
              <p className="font-medium">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-slate-400">Created at</p>
              <p className="font-medium">
                {new Date(selectedUser.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="font-medium">
                {selectedUser.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------- Edit Dialog --------
type EditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserRow | null;
  editForm: EditForm;
  onEditFormChange: (form: EditForm) => void;
  onSave: () => void;
  isSaving: boolean;
};

export function EditDialog({
  open,
  onOpenChange,
  selectedUser,
  editForm,
  onEditFormChange,
  onSave,
  isSaving,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update the user&apos;s basic information.
          </DialogDescription>
        </DialogHeader>
        {selectedUser && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-firstName" className="text-xs text-slate-200">
                First name
              </Label>
              <Input
                id="edit-firstName"
                value={editForm.firstName}
                onChange={e =>
                  onEditFormChange({
                    ...editForm,
                    firstName: e.target.value,
                  })
                }
                className="h-9 text-sm bg-slate-900/70 border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-lastName" className="text-xs text-slate-200">
                Last name
              </Label>
              <Input
                id="edit-lastName"
                value={editForm.lastName}
                onChange={e =>
                  onEditFormChange({
                    ...editForm,
                    lastName: e.target.value,
                  })
                }
                className="h-9 text-sm bg-slate-900/70 border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email" className="text-xs text-slate-200">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={e =>
                  onEditFormChange({
                    ...editForm,
                    email: e.target.value,
                  })
                }
                className="h-9 text-sm bg-slate-900/70 border-slate-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={editForm.isActive}
                onChange={e =>
                  onEditFormChange({
                    ...editForm,
                    isActive: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="edit-active" className="text-xs text-slate-200">
                Active
              </Label>
            </div>
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-sky-600 hover:bg-sky-500"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
