import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const useUserProfile = () => {
  const [userName, setUserNameState] = useState<string>('');
  const [userEmail, setUserEmailState] = useState<string>('');
  const [memberSinceDate, setMemberSinceDate] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const name = await AsyncStorage.getItem('userName');
    const email = await AsyncStorage.getItem('userEmail');
    const since = await AsyncStorage.getItem('memberSinceDate');
    if (name) setUserNameState(name);
    if (email) setUserEmailState(email);
    if (since) setMemberSinceDate(since);
  };

  const updateUserName = async (newName: string) => {
    await AsyncStorage.setItem('userName', newName);
    setUserNameState(newName);
  };

  const updateUserEmail = async (newEmail: string) => {
    await AsyncStorage.setItem('userEmail', newEmail);
    setUserEmailState(newEmail);
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

