export default function UserCard({ user }) {
  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="user-card">
      <div className="user-card-header">
        <div className="user-avatar-lg">{initial}</div>
        <div>
          <p className="user-card-name">{user?.name}</p>
          <p className="user-card-email">{user?.email}</p>
        </div>
      </div>

      <div className="user-card-body">
        <span className="user-tag">{user?.role || 'Passenger'}</span>
        {user?.tripsCount != null && (
          <p className="user-card-meta">{user.tripsCount} trips</p>
        )}
      </div>
    </div>
  );
}
