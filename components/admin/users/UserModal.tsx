import { User } from '@/types/admin';
import { UserModalContainer } from './UserModalContainer';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => Promise<void>;
}

export function UserModal({ user, isOpen, onClose, onDataChange }: UserModalProps) {
  return (
    <UserModalContainer 
      user={user}
      isOpen={isOpen}
      onClose={onClose}
      onDataChange={onDataChange}
    />
  );
}