import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserName, setUserName, getUserEmail, setUserEmail } from '../utils/profileStorage';
import { syncUserToSupabase } from '../utils/supabase';

export const useUserProfile = () => {
  const [userName, setUserNameState] = useState<string>('');
  const [userEmail, setUserEmailState] = useState<string>('');
  const [memberSinceDate, setMemberSinceDate] = useState<string>('');

  const loadProfile = async () => {
    const [name, email, since] = await Promise.all([
      getUserName(),
      getUserEmail(),
      AsyncStorage.getItem('memberSinceDate'),
    ]);
    if (name) setUserNameState(name);
    if (email) setUserEmailState(email);
    if (since) setMemberSinceDate(since);
  };

  const updateUserName = async (newName: string) => {
    await setUserName(newName);
    setUserNameState(newName);
    syncUserToSupabase().catch((e) => console.error("syncUserToSupabase failed:", e));
  };

  const updateUserEmail = async (newEmail: string) => {
    await setUserEmail(newEmail);
    setUserEmailState(newEmail);
    syncUserToSupabase().catch((e) => console.error("syncUserToSupabase failed:", e));
  };

  return {
    userName,
    userEmail,
    memberSinceDate,
    updateUserName,
    updateUserEmail,
    loadProfile,
  };
};
