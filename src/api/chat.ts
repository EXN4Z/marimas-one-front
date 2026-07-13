import api from './axios';

export const sendChatMessage = async (message: string): Promise<string> => {
  const res = await api.post('/chat', { message });
  return res.data.reply;
};