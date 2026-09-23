import { supabase } from '../lib/supabase';
import { Member, OrderWithItems, Person, SummaryResult } from '../types';

const ORDER_WITH_ITEMS_SELECT = '*, payer:members(name), order_items(*, members(name))';

export const getRecentOrders = async (): Promise<OrderWithItems[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_WITH_ITEMS_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const getOrderById = async (orderId: string): Promise<OrderWithItems | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
};

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

export interface MemberUsernames {
  shopee_username: string;
  gojek_username: string;
  grab_username: string;
}

const cleanUsernames = (usernames: MemberUsernames) => ({
  shopee_username: usernames.shopee_username.trim() || null,
  gojek_username: usernames.gojek_username.trim() || null,
  grab_username: usernames.grab_username.trim() || null,
});

export const addMember = async (name: string, usernames: MemberUsernames): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: name.trim(),
      ...cleanUsernames(usernames),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMember = async (
  memberId: string,
  name: string,
  usernames: MemberUsernames
): Promise<void> => {
  const { error } = await supabase
    .from('members')
    .update({ name: name.trim(), ...cleanUsernames(usernames) })
    .eq('id', memberId);

  if (error) throw error;
};

export const setMemberActive = async (memberId: string, active: boolean): Promise<void> => {
  const { error } = await supabase
    .from('members')
    .update({ active })
    .eq('id', memberId);

  if (error) throw error;
};

export const setOrderItemSettled = async (itemId: string, settled: boolean): Promise<string | null> => {
  const settledAt = settled ? new Date().toISOString() : null;
  const { error } = await supabase
    .from('order_items')
    .update({ settled, settled_at: settledAt })
    .eq('id', itemId);

  if (error) throw error;
  return settledAt;
};

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
