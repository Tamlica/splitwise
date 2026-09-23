import { useEffect, useState } from 'react';
import { UserPlus, UserCheck, UserX, Pencil, Check, X } from 'lucide-react';
import { Member } from '../types';
import {
  getAllMembers,
  addMember,
  updateMember,
  setMemberActive,
  MemberUsernames,
} from '../utils/orderOperations';

const EMPTY_USERNAMES: MemberUsernames = { shopee_username: '', gojek_username: '', grab_username: '' };

const USERNAME_FIELDS: { key: keyof MemberUsernames; label: string }[] = [
  { key: 'shopee_username', label: 'Shopee' },
  { key: 'gojek_username', label: 'Gojek' },
  { key: 'grab_username', label: 'Grab' },
];

const inputClass =
  'w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500';

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [usernames, setUsernames] = useState<MemberUsernames>(EMPTY_USERNAMES);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsernames, setEditUsernames] = useState<MemberUsernames>(EMPTY_USERNAMES);

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
      await addMember(name, usernames);
      setName('');
      setUsernames(EMPTY_USERNAMES);
      await loadMembers();
    } catch (err) {
      console.error('Failed to add member:', err);
      setError('Failed to add member. The name may already exist.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (member: Member) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditUsernames({
      shopee_username: member.shopee_username ?? '',
      gojek_username: member.gojek_username ?? '',
      grab_username: member.grab_username ?? '',
    });
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await updateMember(editingId, editName, editUsernames);
      setEditingId(null);
      setError('');
      await loadMembers();
    } catch (err) {
      console.error('Failed to update member:', err);
      setError('Failed to update member. The name may already exist.');
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
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
            className={inputClass}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {USERNAME_FIELDS.map(({ key, label }) => (
              <input
                key={key}
                type="text"
                placeholder={`${label} username (optional)`}
                value={usernames[key]}
                onChange={(e) => setUsernames({ ...usernames, [key]: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                className={inputClass}
              />
            ))}
          </div>
          <button
            onClick={handleAddMember}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors duration-200 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add</span>
          </button>
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
            {[...activeMembers, ...inactiveMembers].map((member) =>
              editingId === member.id ? (
                <div key={member.id} className="p-3 rounded-md bg-teal-50 space-y-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={inputClass}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {USERNAME_FIELDS.map(({ key, label }) => (
                      <input
                        key={key}
                        type="text"
                        placeholder={`${label} username`}
                        value={editUsernames[key]}
                        onChange={(e) => setEditUsernames({ ...editUsernames, [key]: e.target.value })}
                        className={inputClass}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors duration-200"
                    >
                      <Check className="h-4 w-4" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-md ${
                    member.active ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-800">{member.name}</div>
                    {USERNAME_FIELDS.some(({ key }) => member[key]) && (
                      <div className="text-xs text-gray-500">
                        {USERNAME_FIELDS.filter(({ key }) => member[key])
                          .map(({ key, label }) => `${label}: ${member[key]}`)
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(member)}
                      className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
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
                </div>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default MembersPage;
