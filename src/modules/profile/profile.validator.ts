import { z } from 'zod';

export const profileUsernameParamSchema = z.object({
  username: z.string().min(1).max(40),
});
