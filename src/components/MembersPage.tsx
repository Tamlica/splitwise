import { useEffect, useState } from 'react';
import { UserPlus, UserCheck, UserX } from 'lucide-react';
import { Member } from '../types';
import { getAllMembers, addMember, setMemberActive } from '../utils/lunchBotOperations';

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
      setError('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleAddMember = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addMember(name, telegramUsername);
      setName('');
      setTelegramUsername('');
      await loadMembers();
    } catch (err) {
      console.error('Failed to add member:', err);
      setError('Failed to add member. The name may already exist.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: Member) => {
    try {
      await setMemberActive(member.id, !member.active);
      await loadMembers();
    } catch (err) {
      console.error('Failed to update member:', err);
      setError('Failed to update member.');
    }
  };

  const activeMembers = members.filter((m) => m.active);
  const inactiveMembers = members.filter((m) => !m.active);

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Member</h2>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Telegram username (optional)"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              onClick={handleAddMember}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors duration-200 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Members</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500 text-sm">No members yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {[...activeMembers, ...inactiveMembers].map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-3 rounded-md ${
                  member.active ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                }`}
              >
                <div>
                  <div className="font-medium text-gray-800">{member.name}</div>
                  {member.telegram_username && (
                    <div className="text-xs text-gray-500">@{member.telegram_username}</div>
                  )}
                </div>
                <button
                  onClick={() => handleToggleActive(member)}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors duration-200 ${
                    member.active
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {member.active ? (
                    <>
                      <UserX className="h-4 w-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Reactivate
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MembersPage;
