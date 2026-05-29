import axios from 'axios';

export const toErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if ('errors' in data && data.errors && typeof data.errors === 'object') {
        const validationErrors = Object.values(data.errors).flat().filter(Boolean);
        if (validationErrors.length > 0) {
          return validationErrors.join(', ');
        }
      }
      if ('message' in data && typeof data.message === 'string' && data.message.trim().length > 0) {
        return data.message;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};
