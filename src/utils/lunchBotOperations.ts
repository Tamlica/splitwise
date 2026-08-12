import { supabase } from '../lib/supabase';
import { Member, Person, SummaryResult } from '../types';

export const getActiveMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const getAllMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const addMember = async (name: string, telegramUsername: string): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: name.trim(),
      telegram_username: telegramUsername.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const setMemberActive = async (memberId: string, active: boolean): Promise<void> => {
  const { error } = await supabase
    .from('members')
    .update({ active })
    .eq('id', memberId);

  if (error) throw error;
};

const GROUP_CHAT_ID = import.meta.env.VITE_TELEGRAM_GROUP_CHAT_ID ?? '';

export const createOrderWithItems = async (
  payerId: string,
  location: string,
  people: Person[],
  results: SummaryResult,
  memberIdByName: Record<string, string>
): Promise<string> => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      group_chat_id: GROUP_CHAT_ID,
      location: location || 'Lunch order',
      payer_id: payerId,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItemInserts = results.people
    .map((person) => {
      const memberId = memberIdByName[person.name];
      if (!memberId) return null;
      const originalPerson = people.find((p) => p.id === person.id);
      const foodSummary = originalPerson?.foods.length
        ? originalPerson.foods.map((f) => f.name).join(', ')
        : 'Lunch';
      return {
        order_id: order.id,
        member_id: memberId,
        food: foodSummary,
        original_amount: Math.round(person.originalAmount),
        final_amount: Math.round(person.finalAmount),
        settled: memberId === payerId,
        settled_at: memberId === payerId ? new Date().toISOString() : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (orderItemInserts.length > 0) {
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemInserts);

    if (itemsError) throw itemsError;
  }

  return order.id;
};
