interface ProfileInfoProps {
  name: string;
  description: string;
}

export default function ProfileInfo({ name, description }: ProfileInfoProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">{name}</h2>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}