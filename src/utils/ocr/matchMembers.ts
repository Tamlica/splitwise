import { Member } from '../../types';
import { OrderApp } from './types';

export interface MemberMatch {
  member: Member;
  /** false when only a near-miss matched, so the user should double-check it. */
  exact: boolean;
}

const usernameField: Record<OrderApp, 'shopee_username' | 'gojek_username' | 'grab_username'> = {
  shopee: 'shopee_username',
  gojek: 'gojek_username',
  grab: 'grab_username',
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return prev[b.length];
}

export function matchMember(username: string, members: Member[], app: OrderApp): MemberMatch | null {
  const target = normalize(username);
  if (!target) return null;

  const field = usernameField[app];
  const candidates = (member: Member) => [member[field], member.name].filter((v): v is string => !!v).map(normalize);

  const exact = members.find((m) => candidates(m).includes(target));
  if (exact) return { member: exact, exact: true };

  if (target.length < 4) return null;
  const near = members.find((m) => candidates(m).some((c) => c.length >= 4 && editDistance(c, target) <= 1));
  return near ? { member: near, exact: false } : null;
}
